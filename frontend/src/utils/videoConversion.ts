const convertVideoToBlob = async (file: File): Promise<Blob> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/convert-video", {
    method: "POST",
    body: formData,
  });

  return response.blob();
};

export default convertVideoToBlob;
