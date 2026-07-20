import { AppDispatch, RootState } from '@/store';
import { createAsyncThunk } from '@reduxjs/toolkit';

export const createAppAsyncThunk = createAsyncThunk.withTypes<{
  state: RootState;
  dispatch: AppDispatch;
  rejectValue: any;
}>();

export const createAsyncThunks = <Return, Payload>(
  typePrefix: string,
  payloadCreator: (arg: Payload, thunkAPI: any) => Promise<Return>
) => {
  const thunk = createAppAsyncThunk<Return, Payload>(typePrefix, payloadCreator);
  return {
    thunk,
    pending: thunk.pending,
    fulfilled: thunk.fulfilled,
    rejected: thunk.rejected,
  };
};
