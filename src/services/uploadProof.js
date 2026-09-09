import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

export async function uploadProof(file, reservationId) {
  const storage = getStorage();
  const proofRef = ref(storage, `proofs/${reservationId}`);
  await uploadBytes(proofRef, file);
  return getDownloadURL(proofRef);
}
