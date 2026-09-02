export async function generateStory({
  prompt,
  genre,
  contentRating,
  modelId,
}: {
  prompt: string;
  genre: string;
  contentRating: string;
  modelId: string;
}) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/stories/generate-uncensored`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        prompt,
        genre,
        contentRating,
        modelId,
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to generate story');
  }

  return response.json();
}

export async function generateVideoFromScene(sceneId: string, imageUrl: string, prompt: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/videos/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify({
      sceneId,
      imageUrl,
      prompt,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate video');
  }

  return response.json();
}

export async function enhanceStory({
  storyId,
  aspect,
}: {
  storyId: string;
  aspect: string;
}) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/creative/enhance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify({
      storyId,
      aspect,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to enhance story');
  }

  return response.json();
}
