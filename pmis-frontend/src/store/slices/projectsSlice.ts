import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Project, APIResponse, APIError, Pagination } from '../../types/index';
import { RootState } from '../store';
import { projectService } from '../../services/projectService';

interface ProjectsState {
  list: Project[];
  selected: Project | null;
  loading: boolean;
  error: string | null;
  filter: string;
  sort: string;
  pagination: Pagination;
}

const initialState: ProjectsState = {
  list: [],
  selected: null,
  loading: false,
  error: null,
  filter: '',
  sort: 'name',
  pagination: { page: 1, limit: 20, total: 0 },
};

export const fetchProjects = createAsyncThunk<
  { projects: Project[]; pagination: Pagination },
  void,
  { rejectValue: string }
>('projects/fetch', async (_, thunkAPI) => {
  try {
    const response = await projectService.getProjects();
    return { projects: response.data, pagination: response.pagination };
  } catch (err: any) {
    return thunkAPI.rejectWithValue(err?.response?.data?.error?.message || 'Failed to fetch projects');
  }
});

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    selectProject(state, action: PayloadAction<Project | null>) {
      state.selected = action.payload;
    },
    setFilter(state, action: PayloadAction<string>) {
      state.filter = action.payload;
    },
    setSort(state, action: PayloadAction<string>) {
      state.sort = action.payload;
    },
    setPagination(state, action: PayloadAction<Pagination>) {
      state.pagination = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.list = action.payload.projects;
        state.pagination = action.payload.pagination;
        state.loading = false;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch projects';
      });
  },
});

export const { selectProject, setFilter, setSort, setPagination } = projectsSlice.actions;
export default projectsSlice.reducer;
