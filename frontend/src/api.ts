import axios, { AxiosError } from "axios";
import { Annotation } from "./types";
import { API_BASE_URL } from "./constants";

// API Error handler
export class ApiError extends Error {
  constructor(public message: string, public status?: number, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

const handleApiError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;
    const data = axiosError.response?.data;
    
    if (status === 404) {
      throw new ApiError('Resource not found', status, data);
    } else if (status === 400) {
      throw new ApiError('Invalid request', status, data);
    } else if (status && status >= 500) {
      throw new ApiError('Server error. Please try again later.', status, data);
    } else if (axiosError.message === 'Network Error') {
      throw new ApiError('Network error. Please check your connection.', undefined, data);
    }
    throw new ApiError(axiosError.message || 'An error occurred', status, data);
  }
  throw new ApiError('An unexpected error occurred');
};

export const uploadImage = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const res = await axios.post(`${API_BASE_URL}/images/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const uploadImagesBulk = async (files: File[]) => {
  try {
    const formData = new FormData();
    files.forEach(file => {
      formData.append("files", file);
    });
    const res = await axios.post(`${API_BASE_URL}/images/bulk`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res;
  } catch (error) {
    return handleApiError(error);
  }
};

export const getImages = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/images/`);
    return res.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const postAnnotations = async (imageId: number, annotations: Annotation[]) => {
  try {
    const res = await axios.post(`${API_BASE_URL}/images/${imageId}/annotations`, annotations);
    return res.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const getAnnotations = async (imageId: number) => {
  try {
    const res = await axios.get(`${API_BASE_URL}/images/${imageId}/annotations`);
    return res.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const downloadAnnotations = async (imageId: number) => {
  try {
    const res = await axios.get(`${API_BASE_URL}/images/${imageId}/download-annotations`, {
      responseType: "blob",
    });
    return res.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const deleteAllAnnotations = async (imageId: number) => {
  try {
    const res = await axios.delete(`${API_BASE_URL}/images/${imageId}/annotations`);
    return res.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const deleteImage = async (imageId: number) => {
  try {
    const res = await axios.delete(`${API_BASE_URL}/images/${imageId}`);
    return res.data;
  } catch (error) {
    return handleApiError(error);
  }
};
