import sharp from 'sharp';

const source = 'public/brand/crest.png';
const fit = { fit: 'contain', background: '#00000000' };
const trimmed = await sharp(source).trim().png().toBuffer();
await sharp(trimmed).resize(256, 256, fit).webp({ quality: 88 }).toFile('public/league-logo.webp');
await sharp(trimmed).resize(256, 256, fit).png({ palette: true, colours: 192 }).toFile('public/league-logo.png');
const badge = {
  admin: '<path fill="#152037" stroke="#ecc65d" stroke-width="7" d="M320 317h150v109q-27 36-75 47-48-12-75-47Z"/><path fill="#ffda75" d="m346 337 26 17 22-25 21 25 26-17-8 48h-78Z"/><text x="395" y="423" text-anchor="middle" font-family="DejaVu Sans,sans-serif" font-weight="bold" font-size="35" fill="white">ADMIN</text>',
  referee: '<circle cx="394" cy="394" r="78" fill="#12161b" stroke="#d4ff53" stroke-width="7"/><rect x="350" y="348" width="53" height="85" rx="7" fill="#ffd541" transform="rotate(-16 376 390)"/><rect x="397" y="355" width="52" height="84" rx="7" fill="#ff4355" transform="rotate(11 422 396)"/>',
};
for (const target of ['viewer','admin','referee']) {
  const layers = [{input:await sharp(trimmed).resize(504,504,fit).png().toBuffer(),gravity:'center'}];
  if (badge[target]) {
    const ring = target === 'admin' ? '#e9bd59' : '#cefa52';
    const inner = target === 'admin' ? '#fff1b7' : '#f24855';
    layers.push({input:Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><circle cx="256" cy="256" r="236" fill="none" stroke="'+ring+'" stroke-width="12"/><circle cx="256" cy="256" r="224" fill="none" stroke="'+inner+'" stroke-width="3"/>'+badge[target]+'</svg>')});
  }
  const icon = await sharp({create:{width:512,height:512,channels:4,background:'#00000000'}}).composite(layers).png().toBuffer();
  for (const [name,size] of [['icon-192',192],['icon-512',512],['apple-touch-icon',180],['favicon',48]]) {
    const output = sharp(icon).resize(size,size);
    if (name === 'apple-touch-icon') output.flatten({background:'#0B0D12'});
    await output.png({palette:true}).toFile('public/icons/'+target+'/'+name+'.png');
  }
  // Keep the entire crest and role badge inside the Android maskable safe circle.
  const safeIcon = await sharp(icon).resize(408,408).png().toBuffer();
  await sharp({create:{width:512,height:512,channels:4,background:'#0B0D12'}})
    .composite([{input:safeIcon,gravity:'center'}]).png({palette:true})
    .toFile('public/icons/'+target+'/maskable-512.png');

}
