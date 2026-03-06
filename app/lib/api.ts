export async function predictImage(file: File) {
  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch("https://simpletech.in/predict", {
    method: "POST",
    body: formData
  })

  if (!res.ok) {
    throw new Error("Prediction failed")
  }

  return res.json()
}