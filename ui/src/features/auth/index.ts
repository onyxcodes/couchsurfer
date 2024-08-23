import { createSlice, createAsyncThunk, createReducer, nanoid } from '@reduxjs/toolkit';
import { encryptStringWithPublicKey, importPublicKey  } from 'utils/crypto';

export interface AuthState {
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
};

const encryptString = async (string: string) => {
  const publicKeyPem = process.env.PSW_PUBLIC_KEY;

  if (publicKeyPem === undefined) {
    throw new Error("Public key not found");
  }

  // Convert the public key to a CryptoKey
  const publicKey = await importPublicKey(publicKeyPem);

  // Encrypt the symmetric key with the public key
  const encryptedString = await encryptStringWithPublicKey(publicKey, string);
  const encryptedStringBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedString)));

  return encryptedStringBase64;
  // return {encryptedSymmetricKeyBase64, encryptedPasswordBase64, ivBase64};
}

const doLogin = async (data: {
  username: string;
  password: string;
}) => {
  const encryptedStringBase64 = await encryptString(data.password);
      // data.password = encryptString(data.password);
  const response = await fetch("http://localhost:5000/login", {
    method: "POST",
    body: JSON.stringify({
      username: data.username,
      password: encryptedStringBase64
    }),
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.json();
}

export const login = createAsyncThunk('login', 
  async ( data: any, thunkApi) => {
    let response = await doLogin(data);
    if (response.success) {
      const jwtToken = response.token;
      /* Consider that when testing on localhost it may throw an error like
        Cookie “jwtToken” has been rejected because there is already an HTTP-Only cookie but script tried to store a new one.
      */
      // document.cookie = `jwtToken=${jwtToken}; HttpOnly; SameSite=Strict;`;
      document.cookie = `jwtToken=${jwtToken}; SameSite=Strict;`;

      return {
        ...response,
        token: nanoid(), // :)
      };
    } else {
      return thunkApi.rejectWithValue(response);
    }
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