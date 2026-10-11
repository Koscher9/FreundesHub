export const appwriteConfig = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "",
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "",
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "",
  roomCollectionId: process.env.NEXT_PUBLIC_APPWRITE_ROOM_COLLECTION_ID || "",
  gameCollectionId: process.env.NEXT_PUBLIC_APPWRITE_GAME_COLLECTION_ID || "",
  wordsCollectionId: process.env.NEXT_PUBLIC_APPWRITE_WORDS_COLLECTION_ID || "",
};

export function isAppwriteConfigured() {
  return Boolean(
    appwriteConfig.endpoint &&
      appwriteConfig.projectId &&
      appwriteConfig.databaseId,
  );
}

export const localModeBanner =
  "Lokaler Entwicklungsmodus aktiv: Appwrite ist nicht konfiguriert. Die Partitur läuft komplett lokal im Browser.";
