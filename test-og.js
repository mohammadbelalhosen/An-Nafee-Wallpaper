import fetch from 'node-fetch';

async function test(url) {
  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    const data = await response.json();
    
    if (data.contents) {
      const match = data.contents.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i) || 
                    data.contents.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:image"/i) ||
                    data.contents.match(/<meta[^>]*name="twitter:image"[^>]*content="([^"]+)"/i);
      
      if (match && match[1]) {
        console.log(`Success for ${url}:`, match[1].replace(/&amp;/g, '&'));
      } else {
        console.log(`No og:image found for ${url}`);
      }
    } else {
      console.log(`Failed to fetch contents for ${url}`);
    }
  } catch (e) {
    console.error(e);
  }
}

test('https://t.me/telegram/123'); // example telegram message
test('https://unsplash.com/photos/a-man-standing-on-top-of-a-sand-dune-u1o-v3v49A4');
test('https://www.pexels.com/photo/close-up-of-a-cat-123456/');
