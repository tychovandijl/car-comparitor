const axios = require('axios');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'nl-NL,nl;q=0.9',
};

// Haal alle uitrustingsitems op uit de AutoScout24 detailpagina __NEXT_DATA__
function extractEquipment(pageProps) {
  const listing = pageProps.listing || pageProps.listingDetails || pageProps.vehicleDetails || {};
  const vehicle = listing.vehicle || listing.vehicleDetails || {};

  // Probeer meerdere mogelijke locaties
  const equipment = vehicle.equipment || listing.equipment || {};

  const items = [];

  if (Array.isArray(equipment)) {
    // Platte array van strings of objecten
    for (const e of equipment) {
      if (typeof e === 'string') items.push(e);
      else if (e?.label) items.push(e.label);
      else if (e?.name) items.push(e.name);
      else if (e?.value) items.push(e.value);
    }
  } else if (typeof equipment === 'object') {
    // Categorieën (comfort, safety, entertainment, extra, other, ...)
    for (const category of Object.values(equipment)) {
      if (Array.isArray(category)) {
        for (const e of category) {
          if (typeof e === 'string') items.push(e);
          else if (e?.label) items.push(e.label);
          else if (e?.name) items.push(e.name);
          else if (e?.value) items.push(e.value);
        }
      }
    }
  }

  // Ook highlights meenemen als aanvulling
  const highlights = listing.highlights || listing.equipmentHighlights || [];
  for (const h of highlights) {
    if (typeof h === 'string') items.push(h);
    else if (h?.label) items.push(h.label);
  }

  return [...new Set(items.filter(Boolean))];
}

module.exports = async function (context, req) {
  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: CORS_HEADERS };
    return;
  }

  const url = req.query.url;
  if (!url || !url.includes('autoscout24.nl')) {
    context.res = {
      status: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Geef een geldige AutoScout24 URL op.' }),
    };
    return;
  }

  try {
    const res = await axios.get(url, { headers: HEADERS, timeout: 10000 });
    const html = res.data;

    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (!match) {
      context.res = {
        status: 404,
        headers: CORS_HEADERS,
        body: JSON.stringify({ equipment: [] }),
      };
      return;
    }

    const json = JSON.parse(match[1]);
    const pageProps = json?.props?.pageProps || {};
    const equipment = extractEquipment(pageProps);

    context.res = {
      status: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ equipment }),
    };
  } catch (err) {
    context.log.error('car-detail error:', err.message);
    context.res = {
      status: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ equipment: [] }),
    };
  }
};
