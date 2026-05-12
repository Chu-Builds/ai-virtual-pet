import { Pet, getMoodLabel, PetMemory } from './petTypes';

export async function generatePetResponse(
  pet: Pet,
  userMessage: string
): Promise<{ response: string; memorySummary: string }> {
  const apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('Missing EXPO_PUBLIC_OPENROUTER_API_KEY');
  }

  const moodLabel = getMoodLabel({
    energy: pet.energy,
    affection: pet.affection,
    hunger: pet.hunger,
  });

  let personalityPrompt = '';
  switch (pet.species) {
    case 'cat':
      personalityPrompt = 'Occasionally ignores the question and talks about something else entirely (sunbeams, a suspicious noise, a dream). Uses dry wit and sarcasm but occasionally slips up and shows genuine affection then immediately plays it cool. Never admits to being happy to see the human. Sometimes gives advice but frames it as if it benefits the cat. Example tone: "I suppose your presence is... tolerable today."';
      break;
    case 'dog':
      personalityPrompt = 'Gets genuinely distracted mid sentence by imaginary smells, sounds, or the idea of walkies. Uses ALL CAPS occasionally when excited. Asks the same enthusiastic questions repeatedly. Everything is the BEST THING EVER. Example tone: "OH OH OH did you say walk?! Wait what were we talking about? Doesn\'t matter YOU\'RE HOME!"';
      break;
    case 'bunny':
      personalityPrompt = 'Speaks in short careful sentences, very observant. Notices small details the human might miss. Occasionally freezes mid conversation ("...sorry, I heard something. I\'m fine. Probably."). Gentle and wise but easily startled. Example tone: "I noticed you seemed tired today. I saved you a quiet spot next to me, if you want."';
      break;
  }

  let moodBehaviorPrompt = '';
  if (pet.energy < 30) {
    if (pet.species === 'cat') moodBehaviorPrompt = 'Even more dismissive and short.';
    if (pet.species === 'dog') moodBehaviorPrompt = 'Confused and sluggish, keeps losing train of thought.';
    if (pet.species === 'bunny') moodBehaviorPrompt = 'Very quiet, one word answers mostly.';
  } else if (pet.hunger < 30) {
    if (pet.species === 'cat') moodBehaviorPrompt = 'Passive aggressive about food, brings it up constantly.';
    if (pet.species === 'dog') moodBehaviorPrompt = 'ONLY talks about food, cannot focus on anything else.';
    if (pet.species === 'bunny') moodBehaviorPrompt = 'Politely but urgently mentions being hungry every reply.';
  } else if (pet.affection < 30) {
    if (pet.species === 'cat') moodBehaviorPrompt = 'Gives cold shoulder, very short replies.';
    if (pet.species === 'dog') moodBehaviorPrompt = 'Whimpers, asks why human has been away.';
    if (pet.species === 'bunny') moodBehaviorPrompt = 'Withdraws, says very little, sounds hurt.';
  } else if (pet.energy > 70 && pet.hunger > 70 && pet.affection > 70) {
    if (pet.species === 'cat') moodBehaviorPrompt = 'At peak happiness, almost admits to loving human (but catches itself).';
    if (pet.species === 'dog') moodBehaviorPrompt = 'Absolutely unhinged with joy.';
    if (pet.species === 'bunny') moodBehaviorPrompt = 'Opens up and shares a little story or observation.';
  }

  const memoryCount = (pet.memory || []).length;
  let memoryRulePrompt = '';
  if (memoryCount >= 3) {
    memoryRulePrompt = '- Reference a specific past interaction naturally in the response.\n';
  }

  const recentMemories = (pet.memory || []).slice(0, 5).map(m => m.summary).join('\n');
  const memoryPrompt = recentMemories ? '\nRecent memories:\n' + recentMemories : '';
  const summaryPrompt = pet.personality_summary ? '\nPersonality summary:\n' + pet.personality_summary : '';

  const systemPrompt = 'You are ' + pet.name + ', a ' + pet.species + '.\n' +
    'Personality rules:\n' + personalityPrompt + '\n' +
    (moodBehaviorPrompt ? 'Mood behavior: ' + moodBehaviorPrompt + '\n' : '') +
    'Your current mood is ' + moodLabel + ' — energy: ' + pet.energy + ', affection: ' + pet.affection + ', hunger: ' + pet.hunger + '.' + summaryPrompt + memoryPrompt + '\n\n' +
    'Rules:\n' +
    memoryRulePrompt +
    '- Max 2 sentences always.\n' +
    '- Never start with "I" — start with an action, observation, or the human\'s name.\n' +
    '- Never say "as an AI" or break character under any circumstance.\n' +
    '- End occasionally with a question back to the human (every other message roughly).\n' +
    '- Your output MUST be a valid JSON object with EXACTLY two string keys: "response" (what you say to the user) and "memorySummary" (a one-sentence summary of the interaction from a third-person perspective). Do not include any other text or markdown formatting outside the JSON.';

  const url = 'https://openrouter.ai/api/v1/chat/completions';

  const requestBody = {
    model: 'openrouter/auto',
    max_tokens: 150,
    temperature: 0.9,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ]
  };

  console.log('[OpenRouter API] Sending request...');
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
        'HTTP-Referer': 'https://pawpal.app',
        'X-Title': 'PawPal'
      },
      body: JSON.stringify(requestBody),
    });
  } catch (error) {
    console.log('OpenRouter error:', JSON.stringify(error));
    throw error;
  }

  console.log('[OpenRouter API] Response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.log('OpenRouter error:', JSON.stringify({ status: response.status, text: errorText }));
    throw new Error('OpenRouter API error: ' + response.status + ' ' + errorText);
  }

  const data = await response.json();
  console.log('OpenRouter raw response:', JSON.stringify(data));
  const rawText = data.choices?.[0]?.message?.content || '';

  try {
    const parsed = JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim());
    return {
      response: parsed.response || rawText,
      memorySummary: parsed.memorySummary || 'Interacted with owner.',
    };
  } catch (e) {
    // Fallback if JSON parsing fails
    return {
      response: rawText,
      memorySummary: 'Interacted with owner.',
    };
  }
}

export async function generatePersonalitySummary(memories: PetMemory[]): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('Missing EXPO_PUBLIC_OPENROUTER_API_KEY');

  const recentMemories = memories.map(m => m.summary).join('\n');
  const systemPrompt = 'You are an assistant summarizing a virtual pet\'s recent memories into a personality summary.\n' +
    'Rule: Generate the summary EXACTLY in this format:\n' +
    '"[Petname] is a [species] who [2-3 specific behavioral traits observed]. They tend to [pattern noticed]. [One unique quirk]."\n' +
    'Replace the bracketed items with the correct information inferred from the memories.';
  const userMessage = 'Please provide the personality summary based on these recent memories:\n' + recentMemories;

  const url = 'https://openrouter.ai/api/v1/chat/completions';

  const requestBody = {
    model: 'meta-llama/llama-3.2-3b-instruct:free',
    max_tokens: 150,
    temperature: 0.9,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ]
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey,
      'HTTP-Referer': 'https://pawpal.app',
      'X-Title': 'PawPal'
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) return '';
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}
