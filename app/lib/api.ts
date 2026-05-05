export async function predictImage(
  file: File,
  name: string,
  email: string,
  phone_number: string,
  age: number,
  gender: string
) {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("name", name)
  formData.append("email", email)
  formData.append("phone_number", phone_number)
  formData.append("age", String(age))
  formData.append("gender", gender)

  // Update backend URL if needed (e.g., local server or production URL)
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://simpletech.in/predict";

  const res = await fetch(backendUrl, {
    method: "POST",
    body: formData
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Prediction failed")
  }

  return res.json()
}