import axios from "axios";
import { Annotation } from "./types";

const BASE_URL = "http://localhost:8000";

export const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await axios.post(`${BASE_URL}/images/`, formData);
  return res.data;
};

export const getImages = async () => {
  const res = await axios.get(`${BASE_URL}/images/`);
  return res.data;
};

export const postAnnotations = async (imageId: number, annotations: Annotation[]) => {
  return axios.post(`${BASE_URL}/images/${imageId}/annotations`, annotations);
};

export const getAnnotations = async (imageId: number) => {
  const res = await axios.get(`${BASE_URL}/images/${imageId}/annotations`);
  return res.data;
};

export const downloadAnnotations = async (imageId: number) => {
  const res = await axios.get(`${BASE_URL}/images/${imageId}/download-annotations`, {
    responseType: "blob",
  });
  return res.data;
};
