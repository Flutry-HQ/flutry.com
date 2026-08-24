import { sleep } from './function.service';
import { getSession } from './session.service';
import { getAuthData } from './auth.service';
import { data, redirect, type Session } from 'react-router';

export type ActionRunnerResult = {
  session?: Session;
  action: string;
  submitId: string;
  formData: FormData;
  token?: string;
};

export const actionRunner = async (request: Request, actions: string[], verify?: boolean): Promise<ActionRunnerResult> => {
  await sleep(100);

  const formData = await request.formData();

  const action = formData.get('action') as string;
  const submitId = formData.get('submitId') as string;

  if (!action || !submitId || action.trim().length === 0 || submitId.trim().length === 0) {
    throw data(null, {
      status: 400,
    });
  }

  // ! Reject unknown actions.
  if (!actions.includes(action)) {
    throw data(null, {
      status: 400,
    });
  }
  if (verify) {
    const session = await getSession(request.headers.get('Cookie'));

    const session_id = session.get('session_id');

    // ! Authentication session is required.
    if (!session_id) {
      throw redirect('/');
    }
    // ? Resolve session tokens and user data.
    const auth = await getAuthData(session_id);
    if (!auth) {
      throw redirect('/');
    }
    return {
      session,
      action,
      submitId,
      formData,
      token: auth.session.access_token,
    };
  }
  return {
    action,
    submitId,
    formData,
  };
};
