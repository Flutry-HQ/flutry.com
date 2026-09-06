import { destroySession, getSession } from './session.service';
import { data, redirect, type UNSAFE_DataWithResponseInit } from 'react-router';
import { sleep } from './function.service';

export type ActionRunnerResult = {
  action: string;
  submitId: string;
  formData: FormData;
};

const getFormField = (formData: FormData, key: string): string | null => {
  const value = formData.get(key);
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const actionRunner = async (request: Request, actions: string[]): Promise<ActionRunnerResult | UNSAFE_DataWithResponseInit<null>> => {
  try {
    await sleep(100);
    const formData = await request.formData();

    const action = getFormField(formData, 'action');
    const submitId = getFormField(formData, 'submitId');

    if (!action || !submitId || !actions.includes(action)) {
      return data(null, { status: 400 });
    }

    return { action, submitId, formData };
  } catch (error) {
    // A data()/redirect() dobott "response" objektumokat mindig továbbengedjük.
    if (error instanceof Response) throw error;
    console.error('actionRunner:', error);
    return data(null, { status: 400 });
  }
};
