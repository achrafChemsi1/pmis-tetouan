import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, AuthTokens, APIResponse, APIError, LoginFormValues } from '../../types/index';
import { RootState } from '../store';
import { authService } from '../../services/authService';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  tokens: null,
  loading: false,
  error: null,
  isAuthenticated: false,
};

export const login = createAsyncThunk<
  { user: User; tokens: AuthTokens },
  LoginFormValues,
  { rejectValue: string }
>('auth/login', async (form: LoginFormValues, thunkAPI) => {
  try {
    const result = await authService.login(form.email, form.password, form.rememberMe);
    return { user: result.user, tokens: result.tokens };
  } catch (err: any) {
    return thunkAPI.rejectWithValue(err?.response?.data?.error?.message || 'Login failed');
  }
});

export const logout = createAsyncThunk<void, void, { state: RootState }>(
  'auth/logout',
  async (_, thunkAPI) => {
    try {
      await authService.logout();
    } catch {
      // Even if logout API fails, clear frontend state for security
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    setTokens(state, action: PayloadAction<AuthTokens | null>) {
      state.tokens = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.tokens = action.payload.tokens;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Login failed';
        state.isAuthenticated = false;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.tokens = null;
        state.isAuthenticated = false;
        state.loading = false;
      });
  },
});

export const { clearAuthError, setUser, setTokens } = authSlice.actions;
export default authSlice.reducer;
