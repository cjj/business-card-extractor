import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, company } = await request.json();
    
    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'First name and last name are required' }, { status: 400 });
    }

    // Create a LinkedIn search URL
    const fullName = `${firstName} ${lastName}`;
    const searchParams = new URLSearchParams({
      keywords: company ? `${fullName} ${company}` : fullName,
      origin: 'GLOBAL_SEARCH_HEADER'
    });
    
    // Return a LinkedIn search URL that the user can click to find the person
    const linkedinUrl = `https://www.linkedin.com/search/results/people/?${searchParams.toString()}`;
    
    return NextResponse.json({ linkedinUrl });

  } catch (error) {
    console.error('Error searching LinkedIn:', error);
    return NextResponse.json(
      { error: 'Failed to search LinkedIn profile' },
      { status: 500 }
    );
  }
}
