<script setup lang="ts">
// ─── Chart.js via vue-chartjs ──────────────────────────────────────────────
// Mirrors the reference React app's UploadsChart (Line) + StorageChart (Bar)
import { Line, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import type { ChartOptions } from 'chart.js'

// ─── Register Chart.js components (tree-shakeable, must register explicitly) ───
ChartJS.register(
  CategoryScale, LinearScale,
  PointElement, LineElement,
  BarElement,
  Title, Tooltip, Legend, Filler,
)

// ─── Design system tokens (must match main.css :root exactly) ──────────────
const COLOR_PRIMARY        = '#F5A800'
const COLOR_FOREGROUND     = '#0A0A0A'
const COLOR_CARD           = '#FFFFFF'
const COLOR_BORDER         = '#0A0A0A'
const COLOR_MUTED          = '#666666'
const FONT_MONO            = "'Space Mono', monospace"

// ─── Shared axis / tooltip style (Neobrutalist) ───────────────────────────
// Reuse across both charts — no rounded corners, monospace labels, black shadow tooltip
const sharedTickStyle = {
  color: COLOR_FOREGROUND,
  font: { family: FONT_MONO, size: 11 },
}
const sharedTooltip = {
  backgroundColor: COLOR_CARD,
  borderColor: COLOR_BORDER,
  borderWidth: 2,
  titleColor: COLOR_FOREGROUND,
  bodyColor: COLOR_FOREGROUND,
  titleFont: { family: FONT_MONO, size: 12, weight: 'bold' as const },
  bodyFont: { family: FONT_MONO, size: 12 },
  cornerRadius: 0,                     // Sharp corners — Neobrutalist
  padding: 10,
  boxShadow: `4px 4px 0px ${COLOR_BORDER}`,
}
const sharedGridLines = {
  color: `${COLOR_FOREGROUND}18`,      // Very faint grid lines
  lineWidth: 1,
}

// ─── Uploads per day (Line chart) ─────────────────────────────────────────
// Based on mockProjects createdAt — realistic "daily upload" series
export const uploadsLineData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [{
    label: 'Uploads',
    data: [2, 4, 1, 5, 3, 6, 3],
    borderColor: COLOR_PRIMARY,
    backgroundColor: `${COLOR_PRIMARY}22`,
    borderWidth: 3,
    pointBackgroundColor: COLOR_PRIMARY,
    pointBorderColor: COLOR_BORDER,
    pointBorderWidth: 2,
    pointRadius: 5,
    pointHoverRadius: 8,
    tension: 0,                          // step-line feel like reference
    fill: true,
  }],
}

export const uploadsLineOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { ...sharedTooltip },
  },
  scales: {
    x: {
      ticks: sharedTickStyle,
      grid: sharedGridLines,
      border: { color: COLOR_BORDER, width: 2 },
    },
    y: {
      beginAtZero: true,
      ticks: { ...sharedTickStyle, stepSize: 2 },
      grid: sharedGridLines,
      border: { color: COLOR_BORDER, width: 2 },
    },
  },
}

// ─── Likes per project (Bar chart) ────────────────────────────────────────
// Derived from mockProjects — actual like counts per project title
export const likesBarData = {
  labels: [
    'Polyglot Demo',
    'Smart Irrigation',
    'Lost & Found',
    'Jeepney Opt.',
    'PH Risk Map',
    'FSL Translator',
  ],
  datasets: [{
    label: 'Likes',
    data: [24, 18, 31, 42, 29, 55],
    backgroundColor: COLOR_PRIMARY,
    borderColor: COLOR_BORDER,
    borderWidth: 2,
    hoverBackgroundColor: `${COLOR_PRIMARY}cc`,
  }],
}

export const likesBarOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { ...sharedTooltip },
  },
  scales: {
    x: {
      ticks: { ...sharedTickStyle, maxRotation: 40 },
      grid: { display: false },
      border: { color: COLOR_BORDER, width: 2 },
    },
    y: {
      beginAtZero: true,
      ticks: { ...sharedTickStyle, stepSize: 10 },
      grid: sharedGridLines,
      border: { color: COLOR_BORDER, width: 2 },
    },
  },
}

// ─── Comments per project (Bar chart) ────────────────────────────────────
export const commentsBarData = {
  labels: [
    'Polyglot Demo',
    'Smart Irrigation',
    'Lost & Found',
    'Jeepney Opt.',
    'PH Risk Map',
    'FSL Translator',
  ],
  datasets: [{
    label: 'Comments',
    data: [5, 3, 7, 11, 6, 14],
    backgroundColor: COLOR_FOREGROUND,
    borderColor: COLOR_PRIMARY,
    borderWidth: 2,
    hoverBackgroundColor: `${COLOR_FOREGROUND}bb`,
  }],
}

export const commentsBarOptions: ChartOptions<'bar'> = {
  ...likesBarOptions,
  plugins: {
    legend: { display: false },
    tooltip: { ...sharedTooltip },
  },
}
</script>

<template>
  <!-- This component only exports data/options for use in AdminView -->
  <!-- Charts are rendered inline in AdminView.vue via vue-chartjs <Line> <Bar> -->
  <!-- No template output needed — this file is a composable/data module -->
</template>
