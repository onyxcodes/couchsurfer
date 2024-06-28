import { configureStore, Dispatch } from '@reduxjs/toolkit';
import ui, { UIState } from 'features/ui';

export type AppState = {
  ui: UIState,
}

export const store = configureStore({
  reducer: {
    ui,
  },
});