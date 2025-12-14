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
              text: `Please extract contact information from this business card image and return it as a JSON object with the following exact field names (matching Google Contacts CSV import format):

{
  "Name": "",
  "Given Name": "",
  "Family Name": "",
  "E-mail 1 - Type": "",
  "E-mail 1 - Value": "",
  "Phone 1 - Type": "",
  "Phone 1 - Value": "",
  "Address 1 - Type": "",
  "Address 1 - Formatted": "",
  "Address 1 - Street": "",
  "Address 1 - City": "",
  "Address 1 - Region": "",
  "Address 1 - Postal Code": "",
  "Address 1 - Country": "",
  "Organization 1 - Name": "",
  "Organization 1 - Title": "",
  "Website 1 - Type": "",
  "Website 1 - Value": ""
}

Instructions:
- Extract the person's name:
  * Given Name: First name only
  * Family Name: Last name only
  * Name: Full name (Given Name + Family Name)
- Find email address and phone number
- For E-mail 1 - Type: Use "Work" for business emails, "Home" for personal emails
- For E-mail 1 - Value: The actual email address
- For Phone 1 - Type: If there are multiple phone numbers, prioritize mobile/cell numbers and use "Mobile". Otherwise use "Work" for office numbers
- For Phone 1 - Value: The actual phone number (preferably mobile if available, otherwise work/office number)
- For Address 1 - Type: Use "Work" for business addresses
- For Address 1 - Formatted: The complete address as a single string
- For addresses, try to parse street, city, state/region, postal code, and country separately
- If you can't find a specific field, leave it as an empty string
- For Website 1 - Type: Use "Work"
- For Website 1 - Value: The full URL (add https:// if missing)
- Organization 1 - Name should be the company name
- Organization 1 - Title should be the person's job title/position
- Address 1 - Country should be the full country name (e.g., "United States", "Canada", etc.)
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
