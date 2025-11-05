import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Lazy-load OpenAI client to avoid build-time initialization
function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mimeType = file.type;

    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please extract contact information from this business card image and return it as a JSON object with the following exact field names:

{
  "First Name": "",
  "Last Name": "",
  "E-mail 1": "",
  "Phone 1": "",
  "Address 1": "",
  "Country": "",
  "Address 1 - Street": "",
  "Address 1 - Extended Address": "",
  "Address 1 - City": "",
  "Address 1 - Region": "",
  "Address 1 - Postal Code": "",
  "Organization Name": "",
  "Organization Title": "",
  "Website 1 - Value": "",
  "LinkedIn Profile": ""
}

Instructions:
- Extract the person's first and last name separately
- Find email address and phone number
- For Phone 1: If there are multiple phone numbers, prioritize mobile/cell numbers over office/work numbers. Look for labels like "mobile", "cell", "personal" or numbers that appear to be mobile format
- For addresses, try to parse street, city, state/region, and postal code separately
- If you can't find a specific field, leave it as an empty string
- For websites, include the full URL (add https:// if missing)
- Organization Name should be the company name
- Organization Title should be the person's job title/position
- Address 1 should be the complete address as a single string
- Country should be inferred from context (default to "United States" if unclear)
- For LinkedIn Profile: Leave empty for now (will be filled by separate search)
- Return ONLY the JSON object, no additional text or formatting`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64}`
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.1
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    let extractedData;
    try {
      // Clean the response in case there's extra text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : content;
      extractedData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content, parseError);
      throw new Error('Failed to parse extracted data');
    }

    return NextResponse.json({ data: extractedData });

  } catch (error) {
    console.error('Error extracting data:', error);
    return NextResponse.json(
      { error: 'Failed to extract data from image' },
      { status: 500 }
    );
  }
}
