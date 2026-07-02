import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LiveLogisticsConsoleProps {
  onStart: () => void;
}

/* ──────────────────────────────────────────────
   INDIA MAP — outline polygon for clipPath
   Traced from the real geographic outline.
   ViewBox: 0 0 440 490
   ────────────────────────────────────────────── */
const INDIA_PATH_D =
  'M4040 10225 c-14 -8 -40 -14 -58 -15 -64 0 -119 -22 -173 -66 -57 ' +
  '-47 -124 -77 -199 -89 -25 -4 -89 -29 -142 -56 l-97 -49 -17 -56 c-9 -33 -30 ' +
  '-71 -49 -92 -31 -34 -35 -36 -121 -42 -71 -5 -104 -13 -158 -38 -83 -39 -130 ' +
  '-40 -211 -7 -33 14 -91 30 -130 36 -38 6 -86 19 -106 29 -46 24 -69 26 -152 ' +
  '16 -65 -8 -68 -10 -82 -43 -21 -50 -19 -76 10 -103 16 -15 25 -35 25 -54 0 ' +
  '-17 7 -40 15 -50 22 -30 18 -58 -12 -82 -27 -21 -27 -24 -16 -65 10 -38 9 -50 ' +
  '-8 -88 -10 -24 -19 -51 -19 -60 0 -9 28 -44 63 -77 101 -97 102 -98 156 -95 ' +
  '54 2 47 11 67 -89 5 -26 12 -32 57 -44 29 -8 69 -17 90 -21 43 -7 49 -28 18 ' +
  '-66 -15 -19 -30 -24 -84 -27 -62 -4 -67 -6 -95 -42 -17 -20 -45 -43 -63 -50 ' +
  'l-32 -13 5 -123 c5 -137 -1 -162 -49 -196 -17 -13 -61 -60 -97 -106 -50 -63 ' +
  '-66 -90 -66 -115 0 -57 -9 -71 -56 -91 -58 -24 -107 -86 -205 -257 -77 -134 ' +
  '-85 -141 -164 -154 -64 -11 -92 -30 -110 -78 -10 -27 -34 -58 -60 -80 -54 -45 ' +
  '-101 -127 -110 -190 -4 -26 -12 -50 -17 -53 -5 -3 -30 2 -54 11 -31 12 -58 15 ' +
  '-87 11 -23 -4 -83 -9 -134 -12 l-92 -6 -3 49 c-3 47 -4 48 -38 51 -54 4 -102 ' +
  '-41 -136 -128 -25 -64 -34 -75 -96 -121 -37 -28 -68 -57 -68 -63 0 -7 -9 -21 ' +
  '-21 -32 -12 -10 -30 -31 -40 -46 -25 -35 -12 -72 33 -91 18 -8 44 -26 58 -41 ' +
  '21 -23 30 -26 61 -21 31 5 39 3 52 -16 17 -24 14 -65 -9 -111 -24 -47 -17 -87 ' +
  '27 -160 l41 -68 54 0 c53 0 54 0 54 -30 0 -16 11 -64 25 -107 14 -43 25 -94 ' +
  '25 -114 0 -28 6 -39 25 -49 22 -12 24 -18 19 -49 -3 -20 -15 -44 -26 -54 -17 ' +
  '-14 -19 -22 -11 -39 7 -16 5 -30 -6 -50 -14 -24 -23 -28 -58 -28 -36 0 -44 4 ' +
  '-48 23 -6 22 -7 22 -100 13 -78 -8 -96 -13 -101 -28 -9 -28 -70 -24 -118 10 ' +
  '-41 28 -41 28 -281 35 l-50 2 -3 -46 c-3 -43 -5 -47 -34 -53 -17 -3 -49 -6 ' +
  '-73 -6 -46 0 -82 -27 -72 -55 8 -20 122 -20 157 0 32 18 40 18 40 1 0 -8 -17 ' +
  '-20 -37 -27 -21 -6 -44 -16 -50 -22 -24 -18 -14 -76 27 -157 35 -69 44 -80 66 ' +
  '-80 15 0 48 -16 73 -35 56 -40 109 -54 211 -53 69 1 78 3 107 31 28 26 37 29 ' +
  '77 25 25 -3 49 -1 55 5 7 7 12 5 17 -7 10 -27 -46 -107 -104 -147 -38 -27 -65 ' +
  '-38 -106 -42 -31 -3 -66 -13 -78 -21 -35 -25 -95 -20 -130 9 -16 14 -35 25 ' +
  '-42 25 -18 0 -36 -21 -36 -42 0 -25 74 -143 125 -198 22 -25 57 -70 78 -100 ' +
  '20 -30 95 -123 166 -206 116 -135 134 -152 168 -157 26 -5 45 -2 62 9 17 12 ' +
  '37 15 73 11 41 -5 61 -1 126 27 42 19 87 37 99 40 12 4 31 18 42 32 13 16 29 ' +
  '24 51 24 38 0 69 32 70 73 0 19 12 38 40 63 47 43 51 76 20 147 l-21 46 27 63 ' +
  'c24 59 38 77 57 78 4 0 7 -6 7 -12 0 -28 17 -40 37 -30 11 6 25 7 33 2 11 -7 ' +
  '7 -15 -19 -39 -28 -26 -32 -36 -26 -59 3 -15 7 -43 9 -62 1 -19 8 -46 15 -59 ' +
  '11 -20 19 -23 49 -18 21 3 45 8 56 13 14 5 17 3 14 -7 -5 -14 -26 -23 -80 -34 ' +
  '-21 -4 -34 -18 -53 -55 -31 -62 -32 -87 -1 -101 21 -10 25 -20 31 -83 3 -39 ' +
  '13 -82 22 -94 18 -29 11 -62 -22 -114 -14 -20 -29 -56 -35 -80 -21 -93 -3 ' +
  '-256 34 -296 18 -20 17 -22 -9 -57 -27 -34 -27 -36 -10 -55 10 -11 31 -20 47 ' +
  '-20 25 0 28 -4 28 -31 0 -16 -9 -47 -19 -67 -39 -76 -41 -97 -15 -136 20 -29 ' +
  '23 -40 14 -56 -9 -17 -7 -28 9 -54 15 -24 21 -50 21 -95 0 -54 4 -68 35 -113 ' +
  '35 -50 40 -76 15 -70 -7 1 -9 -4 -6 -15 19 -62 27 -127 36 -272 l10 -164 75 ' +
  '-115 c59 -90 75 -122 75 -151 0 -28 9 -48 40 -85 22 -26 40 -59 40 -71 0 -15 ' +
  '11 -32 30 -45 38 -27 86 -128 95 -200 4 -30 18 -74 31 -97 18 -31 24 -57 24 ' +
  '-100 0 -32 5 -76 10 -98 6 -22 15 -74 20 -115 7 -49 22 -99 44 -145 19 -38 41 ' +
  '-95 50 -125 11 -37 48 -101 116 -199 55 -79 100 -148 100 -154 0 -5 15 -44 34 ' +
  '-87 19 -42 37 -99 41 -126 10 -74 25 -114 62 -169 20 -30 33 -62 33 -81 0 -25 ' +
  '12 -42 59 -87 70 -67 104 -142 56 -124 -8 4 -15 18 -15 32 0 20 -5 25 -25 25 ' +
  '-25 0 -33 -14 -15 -25 6 -3 10 -35 10 -71 0 -57 4 -71 31 -110 17 -25 42 -73 ' +
  '56 -107 31 -77 123 -175 207 -220 33 -18 68 -45 80 -64 27 -42 49 -41 97 2 22 ' +
  '19 49 35 61 35 13 0 43 23 80 61 53 56 58 65 58 107 0 34 8 60 32 99 36 59 58 ' +
  '71 161 83 41 5 76 15 87 25 21 19 72 15 122 -11 43 -22 68 -18 68 11 0 21 -8 ' +
  '27 -66 45 -36 11 -72 20 -80 20 -16 0 -34 31 -34 58 0 10 15 39 33 63 44 57 ' +
  '107 171 107 192 0 13 10 16 53 16 28 -1 59 0 67 0 8 1 27 -1 42 -5 24 -5 29 ' +
  '-2 44 30 15 31 16 44 6 98 -9 44 -9 89 -3 147 8 77 7 88 -13 125 -27 52 -29 ' +
  '193 -4 241 9 17 19 48 23 69 5 26 15 41 32 49 26 12 61 73 99 174 19 50 24 83 ' +
  '24 153 0 88 0 89 -34 117 -18 15 -39 38 -45 51 -15 28 -7 114 16 187 19 58 18 ' +
  '121 -2 170 -18 41 -19 137 -4 203 6 26 27 83 46 128 39 87 60 106 136 119 l39 ' +
  '6 -7 75 c-5 50 -4 74 3 74 20 0 42 -44 42 -85 0 -46 14 -65 45 -65 28 0 46 21 ' +
  '84 96 44 86 46 88 146 79 l85 -7 64 52 c64 50 116 104 116 120 0 4 -13 13 -30 ' +
  '20 -20 8 -30 19 -30 34 0 34 56 104 90 111 16 3 39 14 52 24 13 10 57 35 98 ' +
  '55 113 56 136 75 189 151 53 76 137 153 189 174 22 9 50 39 87 92 31 43 74 92 ' +
  '98 111 53 41 54 42 62 96 4 27 20 61 42 90 31 41 43 49 92 60 62 14 95 37 73 ' +
  '51 -7 4 -24 6 -38 3 -19 -3 -24 0 -24 15 0 48 80 74 118 40 24 -22 54 -21 100 ' +
  '2 20 10 53 22 72 26 77 16 119 49 194 148 25 34 36 59 36 83 0 28 6 38 30 52 ' +
  '37 21 38 45 4 77 l-27 25 13 92 c10 79 17 100 46 139 35 48 59 59 131 59 47 0 ' +
  '148 62 169 103 10 17 20 74 24 132 8 89 13 108 39 150 16 26 39 54 49 61 18 ' +
  '12 20 11 24 -10 6 -27 -5 -50 -38 -86 -30 -32 -45 -156 -24 -195 8 -16 11 -43 ' +
  '7 -79 -6 -62 8 -83 31 -48 8 12 25 22 38 22 18 0 23 6 26 31 4 39 29 59 52 40 ' +
  '11 -9 16 -30 16 -62 0 -52 19 -67 39 -31 7 12 22 17 53 17 36 0 43 3 46 21 2 ' +
  '16 -5 23 -30 30 -27 8 -34 15 -36 42 -3 28 0 32 21 32 23 0 24 3 20 53 -2 28 ' +
  '-9 74 -14 101 -5 27 -7 76 -3 108 l7 58 -32 0 c-34 0 -35 2 -32 71 2 40 0 46 ' +
  '-23 57 -15 6 -26 20 -26 31 0 10 -12 45 -27 77 -24 52 -25 62 -15 101 7 24 12 ' +
  '72 12 106 l0 63 -55 27 c-31 15 -68 27 -84 27 -48 0 -81 71 -46 100 8 7 15 23 ' +
  '15 36 0 20 5 24 29 24 34 0 48 15 53 55 l3 30 66 -3 c50 -2 69 1 79 13 11 13 ' +
  '9 20 -14 44 -15 15 -30 41 -35 57 -6 25 -13 29 -49 32 -29 2 -43 8 -47 21 -11 ' +
  '36 -53 71 -84 71 -40 0 -45 12 -21 52 11 18 20 41 20 50 0 9 18 29 40 45 42 ' +
  '30 51 63 29 105 -6 11 -8 22 -5 25 10 10 92 -27 116 -52 28 -30 70 -34 70 -6 ' +
  '0 35 46 14 66 -31 21 -46 67 -88 97 -88 11 0 31 10 44 22 14 13 27 18 33 12 5 ' +
  '-5 21 -65 35 -134 24 -118 28 -127 62 -156 30 -27 49 -33 122 -44 87 -12 420 ' +
  '-9 513 5 43 6 51 4 108 -35 l61 -41 -29 -34 c-22 -24 -31 -48 -36 -88 -7 -51 ' +
  '-11 -59 -74 -119 -37 -35 -85 -72 -107 -82 -46 -21 -92 -72 -105 -115 -6 -23 ' +
  '-3 -36 16 -65 20 -29 24 -47 24 -106 0 -86 12 -115 40 -100 11 6 20 20 20 30 ' +
  '0 31 18 24 25 -10 7 -32 30 -39 66 -20 16 9 19 22 19 77 0 64 1 67 40 104 26 ' +
  '25 40 47 40 64 0 23 3 25 50 25 61 0 65 -5 86 -142 9 -57 31 -143 49 -193 18 ' +
  '-49 40 -116 49 -148 10 -35 24 -60 34 -64 9 -4 34 -17 56 -31 44 -27 62 -19 ' +
  '47 20 -8 21 -5 32 14 58 22 30 23 34 9 72 -8 24 -14 78 -14 130 0 78 3 92 20 ' +
  '106 11 10 24 38 29 65 5 26 17 57 27 68 21 23 26 120 10 173 -8 27 -7 29 14 ' +
  '23 13 -3 36 1 53 9 28 15 30 14 56 -10 23 -22 31 -24 56 -17 68 20 67 19 60 ' +
  '80 -6 52 -3 61 35 136 23 44 58 97 77 119 33 36 35 42 30 89 -5 35 -14 59 -32 ' +
  '77 -40 41 -33 69 27 110 29 19 60 49 69 65 26 44 40 148 33 245 -6 106 6 137 ' +
  '53 132 26 -3 36 3 58 32 15 20 36 36 47 36 13 0 24 11 31 29 6 17 21 32 33 35 ' +
  '12 3 46 32 75 63 53 57 55 58 91 49 31 -8 41 -6 58 9 19 17 25 18 53 6 46 -19 ' +
  '94 -25 101 -12 4 6 -13 33 -38 59 -26 27 -46 56 -46 64 0 9 21 33 48 54 75 60 ' +
  '81 71 79 141 -1 59 -3 63 -27 68 -15 3 -42 5 -61 4 -19 -1 -52 7 -76 19 -53 ' +
  '27 -85 28 -108 2 -10 -11 -26 -20 -37 -20 -15 0 -18 8 -18 57 0 50 4 61 31 89 ' +
  'l30 31 -38 32 c-25 21 -46 31 -60 28 -13 -2 -29 3 -40 15 -18 20 -11 34 21 40 ' +
  '37 6 26 23 -29 46 -76 31 -104 28 -158 -13 -29 -22 -57 -35 -76 -35 -23 0 -31 ' +
  '-5 -31 -18 0 -11 -8 -26 -17 -35 -25 -21 -118 -5 -153 28 -45 42 -76 41 -98 ' +
  '-2 -7 -12 -32 -29 -56 -38 -34 -13 -45 -23 -50 -45 -4 -22 -12 -29 -32 -32 ' +
  '-20 -2 -30 -11 -38 -33 -23 -62 -35 -75 -72 -75 -70 0 -154 -52 -154 -96 0 ' +
  '-45 -20 -69 -70 -87 -27 -10 -60 -30 -73 -45 -14 -15 -38 -42 -53 -59 -25 -28 ' +
  '-39 -34 -104 -44 -49 -7 -82 -18 -96 -31 -19 -17 -29 -18 -65 -11 -38 7 -44 ' +
  '12 -47 36 -3 21 -11 29 -41 37 -21 6 -44 17 -51 25 -15 18 -36 19 -47 2 -4 -7 ' +
  '-20 -20 -35 -29 -23 -15 -28 -15 -38 -3 -16 19 -60 19 -96 0 -27 -14 -29 -13 ' +
  '-33 3 -4 22 -31 52 -46 52 -7 0 -20 9 -29 19 -30 33 -79 35 -132 7 -26 -14 ' +
  '-69 -30 -96 -37 -44 -12 -52 -19 -78 -65 -19 -33 -30 -66 -30 -90 0 -36 -5 ' +
  '-43 -67 -91 -86 -66 -96 -61 -92 51 2 58 -1 87 -11 104 -17 26 -55 29 -86 8 ' +
  '-11 -8 -43 -16 -69 -18 l-49 -3 -13 -65 c-7 -36 -20 -102 -29 -148 l-15 -83 ' +
  '25 -30 c31 -36 33 -75 6 -109 -12 -16 -20 -41 -20 -67 0 -42 0 -42 -26 -31 ' +
  '-20 9 -27 9 -34 -2 -5 -8 -30 -13 -68 -14 -33 -1 -67 -7 -75 -15 -20 -16 -57 ' +
  '-6 -75 20 -16 23 -58 25 -66 4 -7 -20 -23 -19 -92 9 -71 28 -217 51 -273 41 ' +
  '-39 -6 -40 -6 -49 27 -10 40 -40 48 -88 22 -33 -18 -34 -18 -58 5 -18 17 -32 ' +
  '22 -49 17 -18 -4 -31 2 -53 25 -86 91 -237 189 -291 189 -7 0 -27 -10 -44 -22 ' +
  '-26 -19 -33 -21 -62 -10 -45 16 -56 15 -101 -9 l-38 -20 -54 25 c-30 14 -70 ' +
  '26 -89 26 -26 0 -38 7 -55 31 -21 28 -26 30 -77 28 -53 -3 -57 -1 -110 45 -49 ' +
  '44 -57 47 -79 37 -42 -19 -60 -13 -120 37 -45 38 -60 58 -68 91 -10 39 -15 44 ' +
  '-71 66 -33 14 -73 34 -89 46 -23 17 -37 20 -76 16 -40 -5 -50 -2 -67 16 -10 ' +
  '12 -35 34 -54 49 l-34 28 28 21 c28 21 28 23 21 98 -6 73 -5 78 20 108 14 17 ' +
  '26 40 26 52 0 14 12 26 37 38 24 12 44 31 54 53 10 19 29 46 43 59 54 51 28 ' +
  '84 -123 156 l-62 29 2 41 c3 51 -5 65 -38 65 -15 0 -37 10 -50 22 -16 15 -42 ' +
  '24 -86 29 -53 6 -66 12 -91 41 -15 18 -35 49 -43 68 -31 71 -65 88 -104 49 ' +
  '-27 -27 -33 -20 -20 29 9 30 8 47 -3 73 -8 19 -17 53 -21 77 -5 28 -13 46 -25 ' +
  '50 -25 10 -68 74 -75 115 -5 23 -1 45 9 65 30 57 66 59 95 5 6 -13 30 -32 53 ' +
  '-44 l41 -21 71 50 c72 51 89 79 70 120 -4 10 -12 35 -18 56 -10 37 -15 41 -59 ' +
  '52 -56 14 -87 38 -87 67 0 12 -10 32 -22 45 -19 19 -23 34 -22 79 2 49 5 57 ' +
  '35 83 25 20 49 29 87 33 30 3 56 8 58 10 3 2 11 37 18 76 16 81 36 111 76 111 ' +
  '30 0 80 34 80 55 0 7 16 44 35 81 19 37 35 81 35 98 0 17 9 45 20 61 26 39 26 ' +
  '75 1 75 -10 0 -38 -7 -61 -15 -23 -8 -44 -15 -45 -15 -1 0 -8 13 -15 29 -8 21 ' +
  '-21 32 -43 37 -43 9 -67 32 -67 64 0 15 -6 33 -14 39 -23 19 -79 23 -106 6z';

const INDIA_SCALE_X = 0.013087;
const INDIA_SCALE_Y = -0.013087;
const INDIA_TRANS_X = -20.78;
const INDIA_TRANS_Y = 548.82;

/* Pre-generate a dense dot grid that will be clipped to India */
const MAP_DOTS: { x: number; y: number }[] = [];
for (let y = 2; y <= 430; y += 7) {
  for (let x = 20; x <= 420; x += 7) {
    MAP_DOTS.push({ x, y });
  }
}

const HUBS = [
  { name: 'Srinagar', x: 210, y: 25 },
  { name: 'Delhi NCR', x: 220, y: 70 },
  { name: 'Lucknow', x: 235, y: 110 },
  { name: 'Patna', x: 270, y: 100 },
  { name: 'Guwahati', x: 365, y: 115 },
  { name: 'Kolkata', x: 284, y: 114 },
  { name: 'Bhubaneshwar', x: 270, y: 180 },
  { name: 'Visakhapatnam', x: 240, y: 225 },
  { name: 'Hyderabad', x: 180, y: 248 },
  { name: 'Chennai', x: 218, y: 302 },
  { name: 'Kochi', x: 155, y: 360 },
  { name: 'Bengaluru', x: 152, y: 294 },
  { name: 'Mumbai', x: 106, y: 196 },
  { name: 'Ahmedabad', x: 85, y: 160 },
  { name: 'Jaipur', x: 170, y: 95 },
];

function spokeLines(cx: number, cy: number, r: number, count: number) {
  return Array.from({ length: count }, (_, i) => {
    const a = (i * 2 * Math.PI) / count;
    return { x2: cx + r * Math.cos(a), y2: cy + r * Math.sin(a) };
  });
}

/* ═══════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════ */
export function LiveLogisticsConsole({ onStart }: LiveLogisticsConsoleProps) {
  const [step, setStep] = useState(0);

  /* Auto-advance step 0 → 1 → 2. Step 2 stays (user clicks CTA). */
  useEffect(() => {
    if (step >= 2) return;
    const ms = step === 0 ? 5000 : 7000;
    const t = setTimeout(() => setStep(s => s + 1), ms);
    return () => clearTimeout(t);
  }, [step]);

  /* Rear / front wheel geometry — viewBox 0 0 560 310 */
  const RW = { cx: 160, cy: 255, r: 45 };
  const FW = { cx: 400, cy: 255, r: 45 };

  return (
    <div className="w-full flex flex-col justify-between text-white relative select-none" style={{ minHeight: 540 }}>

      {/* ──── Slide content ──── */}
      <div className="flex-1 flex flex-col justify-center items-center relative">
        <AnimatePresence mode="wait">

          {/* ═══════════ STEP 0 — BICYCLE ═══════════ */}
          {step === 0 && (
            <motion.div
              key="bike"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.45 }}
              className="w-full flex flex-col items-center gap-4"
            >
              {/* Scene wrapper */}
              <div className="w-full relative" style={{ height: 340 }}>

                {/* Scrolling city silhouette */}
                <div className="absolute bottom-[80px] left-0 right-0 h-24 overflow-hidden opacity-[0.08] pointer-events-none">
                  <svg className="animate-[panCity_14s_linear_infinite] h-full" style={{ width: 2000 }} viewBox="0 0 2000 96" preserveAspectRatio="none">
                    {[0, 1000].map(ox => (
                      <g key={ox}>
                        <rect x={ox + 40} y={20} width={32} height={76} fill="white" />
                        <rect x={ox + 85} y={8} width={22} height={88} fill="white" />
                        <rect x={ox + 120} y={36} width={42} height={60} fill="white" />
                        <rect x={ox + 178} y={14} width={18} height={82} fill="white" />
                        <rect x={ox + 210} y={44} width={50} height={52} fill="white" />
                        <rect x={ox + 278} y={6} width={26} height={90} fill="white" />
                        <rect x={ox + 320} y={30} width={36} height={66} fill="white" />
                        <rect x={ox + 374} y={22} width={20} height={74} fill="white" />
                        <rect x={ox + 410} y={48} width={55} height={48} fill="white" />
                        <rect x={ox + 485} y={12} width={28} height={84} fill="white" />
                        <rect x={ox + 530} y={34} width={38} height={62} fill="white" />
                        <rect x={ox + 588} y={4} width={24} height={92} fill="white" />
                        <rect x={ox + 630} y={40} width={32} height={56} fill="white" />
                        <rect x={ox + 680} y={18} width={44} height={78} fill="white" />
                        <rect x={ox + 745} y={50} width={26} height={46} fill="white" />
                        <rect x={ox + 790} y={10} width={30} height={86} fill="white" />
                        <rect x={ox + 840} y={28} width={22} height={68} fill="white" />
                        <rect x={ox + 880} y={42} width={48} height={54} fill="white" />
                        <rect x={ox + 946} y={16} width={34} height={80} fill="white" />
                      </g>
                    ))}
                  </svg>
                </div>

                {/* Road surface */}
                <div className="absolute bottom-[60px] left-0 right-0 h-[2px] bg-white/25" />
                <div className="absolute bottom-[52px] left-0 right-0 overflow-hidden h-[2px]">
                  <div className="animate-[panRoad_1.2s_linear_infinite] flex gap-4" style={{ width: 1200 }}>
                    {Array.from({ length: 60 }, (_, i) => (
                      <div key={i} className="w-4 h-[2px] bg-white/35 flex-shrink-0" />
                    ))}
                  </div>
                </div>
                <div className="absolute bottom-[44px] left-0 right-0 h-[2px] bg-white/25" />

                {/* Dotted Delivery Van SVG (Scaled up by 25% via container origin props, with overflow-visible) */}
                <svg
                  className="absolute bottom-[44px] left-1/2 -translate-x-1/2 overflow-visible"
                  width="540"
                  height="384"
                  viewBox="-40 -140 640 455"
                  style={{ overflow: 'visible' }}
                >
                  <defs>
                    <linearGradient id="geminiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#2285FF" />
                      <stop offset="35%" stopColor="#925FFF" />
                      <stop offset="70%" stopColor="#FF5BAE" />
                      <stop offset="100%" stopColor="#FFA07A" />
                    </linearGradient>
                  </defs>
                  <motion.g
                    initial={{ scale: 1.25, originX: 0.5, originY: 0.85 }}
                    animate={{ y: [0, -1.2, 0, -0.8, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    {/* ── REAR WHEEL ── */}
                    <g className="animate-[spinRear_1.2s_linear_infinite]">
                      {/* Outer Tire */}
                      <circle cx={160} cy={255} r={45} stroke="white" strokeWidth="4" strokeDasharray="6 4" fill="none" />
                      {/* Inner Rim */}
                      <circle cx={160} cy={255} r={32} stroke="white" strokeWidth="1.5" strokeDasharray="3 3" fill="none" opacity="0.6" />
                      {/* Hub */}
                      <circle cx={160} cy={255} r={10} stroke="white" strokeWidth="1.5" fill="none" />
                      {/* Spokes */}
                      {spokeLines(160, 255, 43, 12).map((s, i) => (
                        <line key={i} x1={160} y1={255} x2={s.x2} y2={s.y2} stroke="white" strokeWidth="0.8" opacity="0.45" />
                      ))}
                    </g>
                    <circle cx={160} cy={255} r="4" fill="white" />

                    {/* ── FRONT WHEEL ── */}
                    <g className="animate-[spinFront_1.2s_linear_infinite]">
                      {/* Outer Tire */}
                      <circle cx={400} cy={255} r={45} stroke="white" strokeWidth="4" strokeDasharray="6 4" fill="none" />
                      {/* Inner Rim */}
                      <circle cx={400} cy={255} r={32} stroke="white" strokeWidth="1.5" strokeDasharray="3 3" fill="none" opacity="0.6" />
                      {/* Hub */}
                      <circle cx={400} cy={255} r={10} stroke="white" strokeWidth="1.5" fill="none" />
                      {/* Spokes */}
                      {spokeLines(400, 255, 43, 12).map((s, i) => (
                        <line key={i} x1={400} y1={255} x2={s.x2} y2={s.y2} stroke="white" strokeWidth="0.8" opacity="0.45" />
                      ))}
                    </g>
                    <circle cx={400} cy={255} r="4" fill="white" />

                    {/* ── MUDGUARDS / FENDERS ── */}
                    {/* Mudguard Rear */}
                    <path d="M 110,255 A 50,50 0 0,1 210,255" stroke="white" strokeWidth="2.5" strokeDasharray="3 3" fill="none" opacity="0.6" />
                    {/* Mudguard Front */}
                    <path d="M 350,255 A 50,50 0 0,1 450,255" stroke="white" strokeWidth="2.5" strokeDasharray="3 3" fill="none" opacity="0.6" />
                    {/* Mudflap Rear */}
                    <line x1="75" y1="220" x2="75" y2="255" stroke="white" strokeWidth="3" opacity="0.8" />
                    <rect x="71" y="255" width="8" height="12" fill="white" opacity="0.8" />

                    {/* ── CHASSIS & UNDERCARRIAGE DETAILS ── */}
                    {/* Main Chassis Beam */}
                    <line x1="75" y1="200" x2="340" y2="200" stroke="white" strokeWidth="4" />
                    {/* Fuel Tank */}
                    <rect x="235" y="205" width="70" height="22" rx="2" stroke="white" strokeWidth="1.5" strokeDasharray="3 3" fill="none" opacity="0.7" />
                    {/* Exhaust Pipe */}
                    <path d="M 220,215 L 85,215 L 85,230" stroke="white" strokeWidth="1.5" fill="none" opacity="0.5" />

                    {/* ── FLATBED CARGO RACK ── */}
                    {/* Horizontal wood slats */}
                    <line x1="80" y1="185" x2="335" y2="185" stroke="white" strokeWidth="2.5" strokeDasharray="6 3" opacity="0.8" />
                    <line x1="80" y1="168" x2="335" y2="168" stroke="white" strokeWidth="2.5" strokeDasharray="6 3" opacity="0.8" />
                    <line x1="80" y1="151" x2="335" y2="151" stroke="white" strokeWidth="2.5" strokeDasharray="6 3" opacity="0.8" />
                    {/* Vertical stakes */}
                    {[80, 140, 200, 260, 330].map(x => (
                      <line key={x} x1={x} y1="145" x2={x} y2="200" stroke="white" strokeWidth="3" />
                    ))}
                    {/* Top rack rail */}
                    <line x1="77" y1="145" x2="333" y2="145" stroke="white" strokeWidth="3.5" />

                    {/* ── CARGO LOAD: 3-TIER BOX STACK WITH OPENABLE LIDS ── */}
                    {/* Bottom Layer */}
                    {/* Box 1 */}
                    <rect x="90" y="105" width="60" height="40" rx="1" stroke="white" strokeWidth="2" strokeDasharray="4 2" fill="none" />
                    <line x1="120" y1="105" x2="120" y2="145" stroke="white" strokeWidth="1.5" strokeDasharray="3 1" opacity="0.65" />
                    <rect x="96" y="112" width="12" height="8" stroke="white" strokeWidth="0.8" fill="none" opacity="0.5" />

                    {/* Box 2 */}
                    <rect x="155" y="100" width="70" height="45" rx="1" stroke="white" strokeWidth="2" strokeDasharray="4 2" fill="none" />
                    <line x1="190" y1="100" x2="190" y2="145" stroke="white" strokeWidth="1.5" strokeDasharray="3 1" opacity="0.65" />
                    <rect x="162" y="108" width="14" height="12" stroke="white" strokeWidth="0.8" fill="none" opacity="0.5" />

                    {/* Box 3 */}
                    <rect x="230" y="110" width="55" height="35" rx="1" stroke="white" strokeWidth="2" strokeDasharray="4 2" fill="none" />
                    <line x1="257" y1="110" x2="257" y2="145" stroke="white" strokeWidth="1.5" strokeDasharray="3 1" opacity="0.65" />

                    {/* Box 4 */}
                    <rect x="290" y="105" width="40" height="40" rx="1" stroke="white" strokeWidth="2" strokeDasharray="4 2" fill="none" />
                    <line x1="310" y1="105" x2="310" y2="145" stroke="white" strokeWidth="1.5" strokeDasharray="3 1" opacity="0.65" />

                    {/* Second Layer */}
                    {/* Box 5 */}
                    <rect x="110" y="70" width="70" height="35" rx="1" stroke="white" strokeWidth="2" strokeDasharray="4 2" fill="none" />
                    <line x1="145" y1="70" x2="145" y2="105" stroke="white" strokeWidth="1.5" strokeDasharray="3 1" opacity="0.65" />
                    <rect x="116" y="78" width="12" height="10" stroke="white" strokeWidth="0.8" fill="none" opacity="0.5" />

                    {/* Box 6 */}
                    <rect x="185" y="60" width="70" height="40" rx="1" stroke="white" strokeWidth="2" strokeDasharray="4 2" fill="none" />
                    <line x1="220" y1="60" x2="220" y2="100" stroke="white" strokeWidth="1.5" strokeDasharray="3 1" opacity="0.65" />

                    {/* Box 7 */}
                    <rect x="260" y="75" width="60" height="30" rx="1" stroke="white" strokeWidth="2" strokeDasharray="4 2" fill="none" />
                    <line x1="290" y1="75" x2="290" y2="110" stroke="white" strokeWidth="1.5" strokeDasharray="3 1" opacity="0.65" />

                    {/* Top Layer (Modified to support animated opening lids) */}
                    {/* Box 8 Body */}
                    <path d="M 135,45 L 135,70 L 215,70 L 215,45" stroke="white" strokeWidth="2" strokeDasharray="4 2" fill="none" />
                    <line x1="175" y1="45" x2="175" y2="70" stroke="white" strokeWidth="1.5" strokeDasharray="3 1" opacity="0.65" />
                    {/* Box 8 Lid */}
                    <motion.line
                      x1="135"
                      y1="45"
                      x2="215"
                      y2="45"
                      stroke="white"
                      strokeWidth="2.2"
                      animate={{ y: 0, rotate: 0 }}
                      transition={{ duration: 0.8, type: 'spring', stiffness: 60 }}
                    />

                    {/* Box 9 Body */}
                    <path d="M 225,40 L 225,60 L 295,60 L 295,40" stroke="white" strokeWidth="2" strokeDasharray="4 2" fill="none" />
                    <line x1="260" y1="40" x2="260" y2="60" stroke="white" strokeWidth="1.5" strokeDasharray="3 1" opacity="0.65" />
                    {/* Box 9 Lid */}
                    <motion.line
                      x1="225"
                      y1="40"
                      x2="295"
                      y2="40"
                      stroke="white"
                      strokeWidth="2.2"
                      animate={{ y: 0, rotate: 0 }}
                      transition={{ duration: 0.8, type: 'spring', stiffness: 60 }}
                    />

                    {/* ── CABIN (FRONT DRIVER CAB) ── */}
                    {/* Outer Cabin Shell */}
                    <path
                      d="M 340,255 L 340,130 L 410,130 L 460,200 L 470,200 L 470,260 L 450,260 L 450,270 L 435,270 L 435,260 L 340,260 Z"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeDasharray="4 4"
                      fill="none"
                      strokeLinejoin="round"
                    />
                    {/* Side Door & Window */}
                    <path
                      d="M 350,140 L 400,140 L 440,195 L 350,195 Z"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                      fill="none"
                      opacity="0.75"
                    />
                    <line x1="390" y1="140" x2="390" y2="195" stroke="white" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.6" />
                    {/* Door Seam */}
                    <path
                      d="M 340,130 M 345,195 L 345,255"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                      opacity="0.5"
                    />
                    <rect x="352" y="205" width="10" height="4" rx="1" fill="white" opacity="0.8" />
                    {/* Side Mirror */}
                    <path d="M 445,180 L 455,180 L 455,200" stroke="white" strokeWidth="2" fill="none" />
                    <rect x="453" y="190" width="4" height="12" rx="1" fill="white" />
                    {/* Headlight */}
                    <rect x="462" y="210" width="8" height="14" rx="1" stroke="white" strokeWidth="1.5" fill="none" />
                    <circle cx="466" cy="217" r="2" fill="white" className="animate-pulse" />
                    {/* Grille */}
                    <line x1="470" y1="228" x2="470" y2="248" stroke="white" strokeWidth="2" opacity="0.8" />
                    <line x1="466" y1="232" x2="470" y2="232" stroke="white" strokeWidth="1" opacity="0.5" />
                    <line x1="466" y1="238" x2="470" y2="238" stroke="white" strokeWidth="1" opacity="0.5" />
                    <line x1="466" y1="244" x2="470" y2="244" stroke="white" strokeWidth="1" opacity="0.5" />
                    {/* Front Bumper */}
                    <rect x="455" y="260" width="20" height="8" rx="2" fill="white" />

                  </motion.g>
                </svg>
              </div>

              {/* Caption */}
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="text-center text-white/80 text-base font-medium"
              >
                Your orders, dispatched within minutes.
              </motion.p>
            </motion.div>
          )}

          {/* ═══════════ STEP 1 — INDIA DOT MAP ═══════════ */}
          {step === 1 && (
            <motion.div
              key="map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.45 }}
              className="w-full flex flex-col items-center gap-4"
            >
              <div className="w-full flex justify-center" style={{ height: 480 }}>
                <svg width="100%" height="480" viewBox="0 0 440 490" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <clipPath id="india-clip">
                      <path
                        transform={`translate(${INDIA_TRANS_X}, ${INDIA_TRANS_Y}) scale(${INDIA_SCALE_X}, ${INDIA_SCALE_Y})`}
                        d={INDIA_PATH_D}
                      />
                    </clipPath>
                  </defs>

                  {/* Scaled overall Map Group (scaled by 1.12 to enlarge locations and boundary shape) */}
                  <g transform="scale(1.12) translate(-22, -15)">
                    {/* India outline path */}
                    <motion.path
                      transform={`translate(${INDIA_TRANS_X}, ${INDIA_TRANS_Y}) scale(${INDIA_SCALE_X}, ${INDIA_SCALE_Y})`}
                      d={INDIA_PATH_D}
                      fill="none"
                      stroke="white"
                      strokeWidth="1.2"
                      strokeDasharray="3 3"
                      opacity="0.28"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, ease: 'easeInOut' }}
                    />

                    {/* Dot grid clipped to India outline */}
                    <motion.g
                      clipPath="url(#india-clip)"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 1 }}
                    >
                      {MAP_DOTS.map((d, i) => (
                        <circle key={i} cx={d.x} cy={d.y} r="3" fill="white" opacity="0.35" />
                      ))}
                    </motion.g>

                    {/* Hub connections */}
                    {HUBS.map((from, i) =>
                      HUBS.slice(i + 1).map((to, j) => {
                        const dist = Math.hypot(from.x - to.x, from.y - to.y);
                        if (dist > 120) return null;
                        return (
                          <motion.line
                            key={`${from.name}-${to.name}`}
                            x1={from.x}
                            y1={from.y}
                            x2={to.x}
                            y2={to.y}
                            stroke="white"
                            strokeWidth="0.8"
                            strokeDasharray="4 4"
                            opacity="0.15"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 0.15 }}
                            transition={{ delay: 1 + (i + j) * 0.1, duration: 0.6 }}
                          />
                        );
                      })
                    )}

                    {/* City hub nodes (Enlarged nodes and labels) */}
                    {HUBS.map((hub, i) => (
                      <motion.g
                        key={hub.name}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.2 + i * 0.15, duration: 0.35, ease: 'backOut' }}
                      >
                        {/* Ping ring */}
                        <circle cx={hub.x} cy={hub.y} r="12" fill="white" opacity="0.12" className="animate-ping" />
                        {/* Solid dot */}
                        <circle cx={hub.x} cy={hub.y} r="6" fill="white" />
                        {/* Label */}
                        <text
                          x={hub.x + 10}
                          y={hub.y + 4}
                          fill="white"
                          fontSize="11"
                          fontWeight="700"
                          fontFamily="system-ui, sans-serif"
                          opacity="0.75"
                        >
                          {hub.name}
                        </text>
                      </motion.g>
                    ))}

                    {/* Animated parcel traveling between hubs */}
                    <motion.circle
                      r="3"
                      fill="#A3FFE0"
                      animate={{
                        cx: HUBS.map(h => h.x),
                        cy: HUBS.map(h => h.y),
                      }}
                      transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                    />
                    <motion.circle
                      r="2.5"
                      fill="white"
                      animate={{
                        cx: [...HUBS].reverse().map(h => h.x),
                        cy: [...HUBS].reverse().map(h => h.y),
                      }}
                      transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                    />
                  </g>
                </svg>
              </div>

              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center text-white/80 text-base font-medium"
              >
                28,000+ pin codes. One platform.
              </motion.p>
            </motion.div>
          )}

          {/* ═══════════ STEP 2 — STATS + CTA ═══════════ */}
          {step === 2 && (
            <motion.div
              key="stats"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45 }}
              className="w-full flex flex-col items-center gap-10"
            >
              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-x-12 gap-y-8 w-full max-w-sm">
                {[
                  { value: '28K+', label: 'Serviceable Pin Codes' },
                  { value: '99.9%', label: 'SLA Delivery Rate' },
                  { value: '14 Hrs', label: 'Avg. Transit Time' },
                  { value: '₹0', label: 'Setup & Integration Fees' },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 * i, duration: 0.4 }}
                    className="flex flex-col items-center text-center"
                  >
                    <span className="text-4xl font-black text-white tracking-tight leading-none">{stat.value}</span>
                    <span className="text-xs text-white/60 mt-2 font-medium">{stat.label}</span>
                  </motion.div>
                ))}
              </div>

              {/* Tagline */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-white/70 text-sm text-center max-w-xs"
              >
                Start shipping in under 2 minutes.&nbsp;No credit card required.
              </motion.p>

              {/* CTA */}
              <motion.button
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.4 }}
                onClick={onStart}
                className="group relative w-full max-w-xs py-4 bg-white text-[#00A86B] font-bold text-sm rounded-xl cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-[0_8px_32px_rgba(255,255,255,0.22)] active:scale-[0.97]"
              >
                {/* Shine sweep */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-[#00A86B]/10 to-transparent" />
                <span className="relative flex items-center justify-center gap-2">
                  Create Free Account
                  <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ──── Progress dots ──── */}
      <div className="flex justify-center gap-2 pt-6">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              step === i ? 'w-6 bg-white' : 'w-1.5 bg-white/25'
            }`}
          />
        ))}
      </div>

      {/* ──── Keyframe animations ──── */}
      <style>{`
        @keyframes panCity {
          from { transform: translateX(0); }
          to   { transform: translateX(-1000px); }
        }
        @keyframes panRoad {
          from { transform: translateX(0); }
          to   { transform: translateX(-96px); }
        }
        @keyframes spinRear {
          from { transform: rotate(0deg);   transform-origin: ${RW.cx}px ${RW.cy}px; }
          to   { transform: rotate(360deg); transform-origin: ${RW.cx}px ${RW.cy}px; }
        }
        @keyframes spinFront {
          from { transform: rotate(0deg);   transform-origin: ${FW.cx}px ${FW.cy}px; }
          to   { transform: rotate(360deg); transform-origin: ${FW.cx}px ${FW.cy}px; }
        }
        @keyframes spinCrank {
          from { transform: rotate(0deg);   transform-origin: 275px 218px; }
          to   { transform: rotate(360deg); transform-origin: 275px 218px; }
        }
      `}</style>
    </div>
  );
}
