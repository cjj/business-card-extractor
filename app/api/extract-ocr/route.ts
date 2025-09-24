import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Import Tesseract dynamically to avoid SSR issues
    const Tesseract = (await import('tesseract.js')).default;
    
    const { data: { text } } = await Tesseract.recognize(file, 'eng', {
      logger: () => {} // Disable logging for API
    });

    const extractedData = parseContactInfoAdvanced(text);
    
    return NextResponse.json({ data: extractedData });

  } catch (error) {
    console.error('Error extracting data:', error);
    return NextResponse.json(
      { error: 'Failed to extract data from image' },
      { status: 500 }
    );
  }
}

function parseContactInfoAdvanced(text: string) {
  const lines = text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const contact = {
    'First Name': '',
    'Last Name': '',
    'E-mail 1': '',
    'Phone 1': '',
    'Address 1': '',
    'Country': '',
    'Address 1 - Street': '',
    'Address 1 - Extended Address': '',
    'Address 1 - City': '',
    'Address 1 - Region': '',
    'Address 1 - Postal Code': '',
    'Organization Name': '',
    'Organization Title': '',
    'Website 1 - Value': '',
    'LinkedIn Profile': ''
  };

  // Enhanced regex patterns
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const phoneRegex = /(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
  const websiteRegex = /(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?/;
  const zipRegex = /\b\d{5}(-\d{4})?\b/;
  
  // Job title keywords
  const titleKeywords = [
    'ceo', 'president', 'vice president', 'vp', 'director', 'manager', 'senior', 'lead', 'head',
    'chief', 'executive', 'officer', 'coordinator', 'specialist', 'analyst', 'consultant',
    'engineer', 'developer', 'designer', 'architect', 'supervisor', 'administrator'
  ];

  // Mobile/cell phone indicators
  const mobileKeywords = ['mobile', 'cell', 'cellular', 'personal', 'm:', 'c:'];

  // Extract email
  const emailMatch = text.match(emailRegex);
  if (emailMatch) {
    contact['E-mail 1'] = emailMatch[0];
  }

  // Extract phone numbers with priority for mobile/cell
  const phoneMatches = Array.from(text.matchAll(phoneRegex));
  if (phoneMatches.length > 0) {
    // Look for mobile/cell phone first
    let selectedPhone = phoneMatches[0][0]; // Default to first phone
    
    for (const match of phoneMatches) {
      const phoneContext = text.substring(Math.max(0, match.index! - 20), match.index! + match[0].length + 20).toLowerCase();
      
      // Check if this phone number has mobile/cell indicators
      if (mobileKeywords.some(keyword => phoneContext.includes(keyword))) {
        selectedPhone = match[0];
        break;
      }
    }
    
    contact['Phone 1'] = selectedPhone;
  }

  // Extract website
  const websiteMatch = text.match(websiteRegex);
  if (websiteMatch) {
    let website = websiteMatch[0];
    if (!website.startsWith('http')) {
      website = 'https://' + website;
    }
    contact['Website 1 - Value'] = website;
  }

  // Process lines to identify names, titles, and organizations
  const processedLines = lines.map(line => ({
    original: line,
    lower: line.toLowerCase(),
    hasEmail: emailRegex.test(line),
    hasPhone: phoneRegex.test(line),
    hasWebsite: websiteRegex.test(line),
    hasTitle: titleKeywords.some(keyword => line.toLowerCase().includes(keyword)),
    wordCount: line.split(/\s+/).length,
    hasNumbers: /\d/.test(line),
    isAllCaps: line === line.toUpperCase() && line.length > 2
  }));

  // Find name (usually first line that's not contact info)
  const nameCandidate = processedLines.find(line => 
    !line.hasEmail && 
    !line.hasPhone && 
    !line.hasWebsite && 
    line.wordCount >= 2 && 
    line.wordCount <= 4 &&
    !line.hasNumbers
  );

  if (nameCandidate) {
    const nameParts = nameCandidate.original.split(/\s+/).filter(part => part.length > 0);
    if (nameParts.length >= 2) {
      contact['First Name'] = nameParts[0];
      contact['Last Name'] = nameParts.slice(1).join(' ');
    } else if (nameParts.length === 1) {
      contact['First Name'] = nameParts[0];
    }
  }

  // Find job title
  const titleCandidate = processedLines.find(line => 
    line.hasTitle && 
    !line.hasEmail && 
    !line.hasPhone && 
    !line.hasWebsite
  );

  if (titleCandidate) {
    contact['Organization Title'] = titleCandidate.original;
  }

  // Find organization (look for lines that might be company names)
  const orgCandidate = processedLines.find(line => 
    !line.hasEmail && 
    !line.hasPhone && 
    !line.hasWebsite && 
    !line.hasTitle &&
    line.original !== (contact['First Name'] + ' ' + contact['Last Name']).trim() &&
    line.wordCount <= 5 &&
    (line.isAllCaps || line.wordCount <= 3)
  );

  if (orgCandidate) {
    contact['Organization Name'] = orgCandidate.original;
  }

  // Extract address information
  const addressLines = processedLines.filter(line => 
    !line.hasEmail && 
    !line.hasPhone && 
    !line.hasWebsite &&
    line.original !== contact['First Name'] + ' ' + contact['Last Name'] &&
    line.original !== contact['Organization Name'] &&
    line.original !== contact['Organization Title'] &&
    (line.hasNumbers || /\b(street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|suite|ste|apt|apartment)\b/i.test(line.original))
  );

  if (addressLines.length > 0) {
    contact['Address 1'] = addressLines.map(line => line.original).join(', ');
    
    // Try to parse city, state, zip from last address line
    const lastAddressLine = addressLines[addressLines.length - 1].original;
    
    // Look for zip code
    const zipMatch = lastAddressLine.match(zipRegex);
    if (zipMatch) {
      contact['Address 1 - Postal Code'] = zipMatch[0];
    }
    
    // Try to parse city, state pattern
    const cityStateRegex = /([^,\d]+),\s*([A-Z]{2})\s*\d{5}/;
    const cityStateMatch = lastAddressLine.match(cityStateRegex);
    
    if (cityStateMatch) {
      contact['Address 1 - City'] = cityStateMatch[1].trim();
      contact['Address 1 - Region'] = cityStateMatch[2];
      contact['Country'] = 'United States';
    } else {
      // Try alternative patterns
      const parts = lastAddressLine.split(',').map(p => p.trim());
      if (parts.length >= 2) {
        contact['Address 1 - City'] = parts[parts.length - 2];
        if (parts[parts.length - 1].match(/^[A-Z]{2}/)) {
          contact['Address 1 - Region'] = parts[parts.length - 1].split(/\s+/)[0];
          contact['Country'] = 'United States';
        }
      }
    }
    
    // Street address (everything except the last line with city/state/zip)
    if (addressLines.length > 1) {
      contact['Address 1 - Street'] = addressLines.slice(0, -1).map(line => line.original).join(', ');
    }
  }

  return contact;
}
