import { api } from './api.service';
import redisService from './redis.service';
import { commitSession, destroySession, getSession } from './session.service';

type SessionData = {
  user_id: string;
  session_id: string;
  access_token: string;
  refresh_token: string;
};

type UserData = Record<string, any>;

type AuthData = {
  session: SessionData;
  user: UserData;
};

/*
 * ! Redis keys
 */

const getSessionCacheKey = (session_id: string) => `session:${session_id}`;

const getUserCacheKey = (user_id: string) => `user:${user_id}`;

/*
 * ! Session cache
 */

const getCachedSession = async (session_id: string): Promise<SessionData | null> => {
  if (process.env.REDIS_TYPE === 'false') {
    console.warn('Redis os not enabled.');
    return null;
  }
  const session = await redisService.get(getSessionCacheKey(session_id));

  if (!session || typeof session !== 'object' || !session.user_id || !session.session_id || !session.access_token || !session.refresh_token) {
    return null;
  }

  return session as SessionData;
};

const setCachedSession = async (session: SessionData) => {
  if (process.env.REDIS_TYPE === 'false') {
    console.warn('Redis os not enabled.');
    return null;
  }
  // * Keep the session cache alive for the refresh lifetime.
  return redisService.set(getSessionCacheKey(session.session_id), session, 7 * 24 * 60 * 60);
};

/*
 * ! User cache
 */

const getCachedUser = async (user_id: string): Promise<UserData | null> => {
  if (process.env.REDIS_TYPE === 'false') {
    console.warn('Redis os not enabled.');
    return null;
  }
  const user = await redisService.get(getUserCacheKey(user_id));

  if (!user || typeof user !== 'object') {
    return null;
  }

  return user as UserData;
};

const setCachedUser = async (user_id: string, user: UserData) => {
  if (process.env.REDIS_TYPE === 'false') {
    console.warn('Redis os not enabled.');
    return null;
  }
  // * User data has a short cache lifetime.
  return redisService.set(getUserCacheKey(user_id), user, 30);
};

/*
 * ! API
 */

const getUserFromApi = async (access_token: string): Promise<UserData | null> => {
  try {
    const { data } = await api.get('/users/@me', access_token);

    if (!data?.user) {
      return null;
    }

    return data.user;
  } catch {
    return null;
  }
};

const refreshFromApi = async (refresh_token: string) => {
  try {
    const { data } = await api.get('/auth/refresh', refresh_token);

    if (!data?.access_token || !data?.refresh_token) {
      return null;
    }

    return data as {
      user_id: string;
      session_id: string;
      access_token: string;
      refresh_token: string;
    };
  } catch {
    return null;
  }
};

/*
 * ! Refresh session
 *
 * ? Refreshes the token pair and stores the
 * ? rotated tokens back in the Redis session.
 */

const refreshSession = async (session: SessionData): Promise<SessionData | null> => {
  const refreshed = await refreshFromApi(session.refresh_token);

  if (!refreshed) {
    return null;
  }

  const newSession: SessionData = {
    user_id: refreshed.user_id || session.user_id,
    session_id: refreshed.session_id || session.session_id,
    access_token: refreshed.access_token,
    refresh_token: refreshed.refresh_token,
  };

  await setCachedSession(newSession);

  return newSession;
};

/*
 * ! Get session/token data only
 */

export const getSessionCache = async (session_id: string): Promise<SessionData | false> => {
  try {
    const session = await getCachedSession(session_id);

    if (!session) {
      return false;
    }

    return session;
  } catch (error) {
    console.error('getSessionCache:', error);
    return false;
  }
};

/*
 * ! Get user data only
 */

export const getUserCache = async (user_id: string): Promise<UserData | null> => {
  try {
    return await getCachedUser(user_id);
  } catch (error) {
    console.error('getUserCache:', error);
    return null;
  }
};

/*
 * ! Get full authentication data
 *
 * ? Returns both session/token data and user data.
 * ? Refreshes the session when the access token expires.
 */

export const getAuthData = async (session_id: string): Promise<AuthData | null> => {
  try {
    let session = await getCachedSession(session_id);

    if (!session) {
      return null;
    }

    let user = await getCachedUser(session.user_id);

    /*
     * ? User cache hit.
     *
     * The session itself is already stored in Redis,
     * so no API request is required here.
     */
    if (user) {
      return {
        session,
        user,
      };
    }

    /*
     * ? User cache miss.
     *
     * Try the current access token first.
     */
    user = await getUserFromApi(session.access_token);

    /*
     * ! Access token expired.
     *
     * Rotate the refresh token pair.
     */
    if (!user) {
      const refreshed = await refreshSession(session);

      if (!refreshed) {
        return null;
      }

      session = refreshed;

      user = await getUserFromApi(session.access_token);

      if (!user) {
        return null;
      }
    }

    await setCachedUser(session.user_id, user);

    return {
      session,
      user,
    };
  } catch (error) {
    console.error('getAuthData:', error);
    return null;
  }
};

/*
 * ! Auth loader
 *
 * ? The cookie contains only session_id.
 * ? Tokens are stored exclusively in Redis.
 */

export const AuthLoader = async (request: Request, cookie?: string[]) => {
  try {
    const session = await getSession(request.headers.get('Cookie'));

    const headers = new Headers();

    if (cookie?.length) {
      headers.set('Set-Cookie', cookie.join(', '));
    }

    const session_id = session.get('session_id');

    /*
     * ! No session cookie.
     */
    if (!session_id) {
      headers.append('Set-Cookie', await destroySession(session));

      return {
        user: null,
        session: null,
        headers,
      };
    }

    /*
     * ? Resolve the complete authentication state.
     */
    const auth = await getAuthData(session_id);

    /*
     * ! Session is invalid or refresh failed.
     */
    if (!auth) {
      headers.append('Set-Cookie', await destroySession(session));

      return {
        user: null,
        session: null,
        headers,
      };
    }

    /*
     * ? Keep only the session ID in the cookie.
     */
    session.set('session_id', auth.session.session_id);

    headers.append('Set-Cookie', await commitSession(session));

    return {
      user: auth.user,
      session: auth.session,
      headers,
    };
  } catch (error) {
    console.error('AuthLoader:', error);

    return {
      user: null,
      session: null,
      headers: new Headers(),
    };
  }
};
