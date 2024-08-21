import { createSlice, createAsyncThunk, createReducer } from '@reduxjs/toolkit';

export interface AuthState {
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
};

export const login = createAsyncThunk('login', 
    async ( data: any, thunkApi) => {
        // TODO
    }
);

export const logout = createAsyncThunk('logout', 
    async ( data: any, thunkApi) => {
        // TODO
    }
);


const auth = createReducer(initialState, builder => { builder
    .addCase(login.fulfilled, (state, action) => {
        state.isAuthenticated = true;
    })
    .addCase(login.rejected, (state, action) => {
        // TODO
        console.error(action.error);
    })
    .addCase(logout.fulfilled, (state, action) => {
        state.isAuthenticated = false;
    })
    .addCase(logout.rejected, (state, action) => {
        // TODO
        console.error(action.error);
    })
});
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state) => {
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.isAuthenticated = false;
    },
  },
});

export default auth;