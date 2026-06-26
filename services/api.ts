const BASE_URL = 'http://192.168.101.104:3000'; // À remplacer par l'IP/ngrok de B1

export const analyzeText = async (text: string) => {
  try {
    const response = await fetch(`${BASE_URL}/api/analyze-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`Erreur serveur : ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Erreur API analyzeText:', error);
    throw error;
  }
};