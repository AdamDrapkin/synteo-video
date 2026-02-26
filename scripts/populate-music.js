#!/usr/bin/env node

import Airtable from 'airtable';

// Configuration - user sets these
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID || 'apprfl6zJJVMW2FDi';
const MUSIC_TABLE_ID = 'tblyRH7innZkrZhKO';

if (!AIRTABLE_API_KEY) {
  console.error('Error: AIRTABLE_API_KEY environment variable not set');
  console.log('\nUsage:');
  console.log('  AIRTABLE_API_KEY=your_key node scripts/populate-music.js');
  process.exit(1);
}

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(BASE_ID);

// All 45 tracks
const tracks = [
  // Gaming (9)
  { 'File Name': 'gaming-high-dark.wav', Category: 'Gaming', Mood: 'Dark', Energy: 'High', Description: 'High energy dark gaming - intense, competitive', Status: 'Active' },
  { 'File Name': 'gaming-high-positive.wav', Category: 'Gaming', Mood: 'Positive', Energy: 'High', Description: 'High energy positive gaming - fun, victories', Status: 'Active' },
  { 'File Name': 'gaming-high-epic.wav', Category: 'Gaming', Mood: 'Epic', Energy: 'High', Description: 'High energy epic gaming - boss battles, championships', Status: 'Active' },
  { 'File Name': 'gaming-medium-dark.wav', Category: 'Gaming', Mood: 'Dark', Energy: 'Medium', Description: 'Medium energy dark gaming - strategy, commentary', Status: 'Active' },
  { 'File Name': 'gaming-medium-positive.wav', Category: 'Gaming', Mood: 'Positive', Energy: 'Medium', Description: 'Medium energy positive gaming - casual, fun', Status: 'Active' },
  { 'File Name': 'gaming-medium-epic.wav', Category: 'Gaming', Mood: 'Epic', Energy: 'Medium', Description: 'Medium energy epic gaming - trailers, highlights', Status: 'Active' },
  { 'File Name': 'gaming-low-dark.wav', Category: 'Gaming', Mood: 'Dark', Energy: 'Low', Description: 'Low energy dark gaming - ambient, late-night', Status: 'Active' },
  { 'File Name': 'gaming-low-positive.wav', Category: 'Gaming', Mood: 'Positive', Energy: 'Low', Description: 'Low energy positive gaming - chill, relaxed', Status: 'Active' },
  { 'File Name': 'gaming-low-epic.wav', Category: 'Gaming', Mood: 'Epic', Energy: 'Low', Description: 'Low energy epic gaming - story, endings', Status: 'Active' },

  // Personal Brand (9)
  { 'File Name': 'creator-high-dark.wav', Category: 'Personal Brand', Mood: 'Dark', Energy: 'High', Description: 'High energy dark creator - hustle, grind', Status: 'Active' },
  { 'File Name': 'creator-high-positive.wav', Category: 'Personal Brand', Mood: 'Positive', Energy: 'High', Description: 'High energy positive creator - success, motivation', Status: 'Active' },
  { 'File Name': 'creator-high-epic.wav', Category: 'Personal Brand', Mood: 'Epic', Energy: 'High', Description: 'High energy epic creator - announcements, milestones', Status: 'Active' },
  { 'File Name': 'creator-medium-dark.wav', Category: 'Personal Brand', Mood: 'Dark', Energy: 'Medium', Description: 'Medium energy dark creator - authentic, real talk', Status: 'Active' },
  { 'File Name': 'creator-medium-positive.wav', Category: 'Personal Brand', Mood: 'Positive', Energy: 'Medium', Description: 'Medium energy positive creator - everyday, storytelling', Status: 'Active' },
  { 'File Name': 'creator-medium-epic.wav', Category: 'Personal Brand', Mood: 'Epic', Energy: 'Medium', Description: 'Medium energy epic creator - professional, polished', Status: 'Active' },
  { 'File Name': 'creator-low-dark.wav', Category: 'Personal Brand', Mood: 'Dark', Energy: 'Low', Description: 'Low energy dark creator - reflective, vulnerable', Status: 'Active' },
  { 'File Name': 'creator-low-positive.wav', Category: 'Personal Brand', Mood: 'Positive', Energy: 'Low', Description: 'Low energy positive creator - authentic, morning', Status: 'Active' },
  { 'File Name': 'creator-low-epic.wav', Category: 'Personal Brand', Mood: 'Epic', Energy: 'Low', Description: 'Low energy epic creator - impact, emotional', Status: 'Active' },

  // Technology (9)
  { 'File Name': 'tech-high-dark.wav', Category: 'Technology', Mood: 'Dark', Energy: 'High', Description: 'High energy dark tech - breaking news, AI reveals', Status: 'Active' },
  { 'File Name': 'tech-high-positive.wav', Category: 'Technology', Mood: 'Positive', Energy: 'High', Description: 'High energy positive tech - launches, breakthroughs', Status: 'Active' },
  { 'File Name': 'tech-high-epic.wav', Category: 'Technology', Mood: 'Epic', Energy: 'High', Description: 'High energy epic tech - major announcements, future', Status: 'Active' },
  { 'File Name': 'tech-medium-dark.wav', Category: 'Technology', Mood: 'Dark', Energy: 'Medium', Description: 'Medium energy dark tech - analysis, tutorials', Status: 'Active' },
  { 'File Name': 'tech-medium-positive.wav', Category: 'Technology', Mood: 'Positive', Energy: 'Medium', Description: 'Medium energy positive tech - startups, features', Status: 'Active' },
  { 'File Name': 'tech-medium-epic.wav', Category: 'Technology', Mood: 'Epic', Energy: 'Medium', Description: 'Medium energy epic tech - conferences, demos', Status: 'Active' },
  { 'File Name': 'tech-low-dark.wav', Category: 'Technology', Mood: 'Dark', Energy: 'Low', Description: 'Low energy dark tech - coding, research', Status: 'Active' },
  { 'File Name': 'tech-low-positive.wav', Category: 'Technology', Mood: 'Positive', Energy: 'Low', Description: 'Low energy positive tech - lifestyle, culture', Status: 'Active' },
  { 'File Name': 'tech-low-epic.wav', Category: 'Technology', Mood: 'Epic', Energy: 'Low', Description: 'Low energy epic tech - ethics, predictions', Status: 'Active' },

  // Finance (9)
  { 'File Name': 'finance-high-dark.wav', Category: 'Finance', Mood: 'Dark', Energy: 'High', Description: 'High energy dark finance - trading, market drama', Status: 'Active' },
  { 'File Name': 'finance-high-positive.wav', Category: 'Finance', Mood: 'Positive', Energy: 'High', Description: 'High energy positive finance - wins, success', Status: 'Active' },
  { 'File Name': 'finance-high-epic.wav', Category: 'Finance', Mood: 'Epic', Energy: 'High', Description: 'High energy epic finance - deals, IPOs', Status: 'Active' },
  { 'File Name': 'finance-medium-dark.wav', Category: 'Finance', Mood: 'Dark', Energy: 'Medium', Description: 'Medium energy dark finance - analysis, education', Status: 'Active' },
  { 'File Name': 'finance-medium-positive.wav', Category: 'Finance', Mood: 'Positive', Energy: 'Medium', Description: 'Medium energy positive finance - entrepreneurship, wealth', Status: 'Active' },
  { 'File Name': 'finance-medium-epic.wav', Category: 'Finance', Mood: 'Epic', Energy: 'Medium', Description: 'Medium energy epic finance - news, updates', Status: 'Active' },
  { 'File Name': 'finance-low-dark.wav', Category: 'Finance', Mood: 'Dark', Energy: 'Low', Description: 'Low energy dark finance - late-night, research', Status: 'Active' },
  { 'File Name': 'finance-low-positive.wav', Category: 'Finance', Mood: 'Positive', Energy: 'Low', Description: 'Low energy positive finance - morning reviews, education', Status: 'Active' },
  { 'File Name': 'finance-low-epic.wav', Category: 'Finance', Mood: 'Epic', Energy: 'Low', Description: 'Low energy epic finance - planning, wealth building', Status: 'Active' },

  // Narrative (9)
  { 'File Name': 'narrative-high-dark.wav', Category: 'Narrative', Mood: 'Dark', Energy: 'High', Description: 'High energy dark narrative - confession, revelation', Status: 'Active' },
  { 'File Name': 'narrative-high-positive.wav', Category: 'Narrative', Mood: 'Positive', Energy: 'High', Description: 'High energy positive narrative - transformation, success', Status: 'Active' },
  { 'File Name': 'narrative-high-epic.wav', Category: 'Narrative', Mood: 'Epic', Energy: 'High', Description: 'High energy epic narrative - testimony, milestone', Status: 'Active' },
  { 'File Name': 'narrative-medium-dark.wav', Category: 'Narrative', Mood: 'Dark', Energy: 'Medium', Description: 'Medium energy dark narrative - reflection, serious', Status: 'Active' },
  { 'File Name': 'narrative-medium-positive.wav', Category: 'Narrative', Mood: 'Positive', Energy: 'Medium', Description: 'Medium energy positive narrative - journey, growth', Status: 'Active' },
  { 'File Name': 'narrative-medium-epic.wav', Category: 'Narrative', Mood: 'Epic', Energy: 'Medium', Description: 'Medium energy epic narrative - storytelling, impact', Status: 'Active' },
  { 'File Name': 'narrative-low-dark.wav', Category: 'Narrative', Mood: 'Dark', Energy: 'Low', Description: 'Low energy dark narrative - vulnerable, intimate', Status: 'Active' },
  { 'File Name': 'narrative-low-positive.wav', Category: 'Narrative', Mood: 'Positive', Energy: 'Low', Description: 'Low energy positive narrative - resolution, peace', Status: 'Active' },
  { 'File Name': 'narrative-low-epic.wav', Category: 'Narrative', Mood: 'Epic', Energy: 'Low', Description: 'Low energy epic narrative - impact, lasting change', Status: 'Active' },
];

async function populateMusicLibrary() {
  console.log(`Adding ${tracks.length} tracks to Airtable Music Library...`);

  // Add tracks in batches of 10 (Airtable limit)
  for (let i = 0; i < tracks.length; i += 10) {
    const batch = tracks.slice(i, i + 10);
    const records = batch.map(track => ({ fields: track }));

    try {
      await base(MUSIC_TABLE_ID).create(records);
      console.log(`Added tracks ${i + 1}-${Math.min(i + 10, tracks.length)}`);
    } catch (error) {
      console.error(`Error adding batch ${Math.floor(i / 10) + 1}:`, error.message);
    }
  }

  console.log('\nDone! Added all 45 tracks to Music Library table.');
}

populateMusicLibrary();
