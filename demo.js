'use strict';
const $ = id => document.getElementById(id);
let config, direction = 1, result = null, busy = false;
const fmt = (value, digits = 2) => Number.isFinite(value) ? value.toFixed(digits) : 'N/A';
const signed = (value, digits = 2) => Number.isFinite(value) ? `${value > 0 ? '+' : ''}${value.toFixed(digits)}` : 'N/A';
const pauseAll = () => document.querySelectorAll('audio').forEach(audio => audio.pause());
document.querySelectorAll('audio').forEach(audio => {
  audio.addEventListener('play', () => document.querySelectorAll('audio').forEach(other => { if (other !== audio) other.pause(); }));
  audio.addEventListener('error', () => { if (audio.getAttribute('src')) status('Audio unavailable. Please reload the result.', true); });
});
const tracks = {
  original: {button:'play-original', time:'original-time', wave:'wave-original', download:'download-original', label:'original audio', color:'#a4b0ba'},
  'result-audio': {button:'play-result', time:'result-time', wave:'wave-result', download:'download-result', label:'generated audio', color:'#d8b879'},
  transition: {button:'play-transition', time:'transition-time', label:'all 5 interpolation steps'}
};
function decodeWave(buffer) {
  const view = new DataView(buffer);
  const text = (offset, size) => String.fromCharCode(...new Uint8Array(buffer, offset, size));
  if (view.byteLength < 44 || text(0, 4) !== 'RIFF' || text(8, 4) !== 'WAVE') throw new Error('Invalid WAV');
  let format, data;
  for (let offset = 12; offset + 8 <= view.byteLength;) {
    const size = view.getUint32(offset + 4, true), start = offset + 8;
    if (start + size > view.byteLength) throw new Error('Incomplete WAV');
    if (text(offset, 4) === 'fmt ' && size >= 16) format = {type:view.getUint16(start, true), channels:view.getUint16(start + 2, true), rate:view.getUint32(start + 4, true), bits:view.getUint16(start + 14, true)};
    if (text(offset, 4) === 'data') data = {start, size};
    offset = start + size + size % 2;
  }
  if (!format || !data || format.type !== 1 || format.bits !== 16 || format.channels !== 1 || format.rate <= 0 || data.size % 2) throw new Error('Unsupported WAV');
  const samples = new Float32Array(data.size / 2);
  for (let i = 0; i < samples.length; i++) samples[i] = view.getInt16(data.start + i * 2, true) / 32768;
  return {samples, duration:samples.length / format.rate};
}
function drawWave(track) {
  if (!track.wave) return;
  const chart = $(track.wave), width = Math.max(chart.clientWidth, 110);
  const left = 25, right = width - 9, center = 35, amplitude = 25;
  chart.setAttribute('viewBox', `0 0 ${width} 92`);
  chart.replaceChildren(); chart.dataset.frames = track.data?.samples.length || 0;
  for (const value of [1, 0, -1]) {
    const y = center - value * amplitude;
    chart.append(svg('line', {x1:left, x2:right, y1:y, y2:y, stroke:value ? '#262c30' : '#3b434b'}));
    chart.append(svg('text', {x:left-5, y:y+3, 'text-anchor':'end', fill:'#909ba5', 'font-size':8, 'font-family':'monospace'}, value > 0 ? '+1' : String(value)));
  }
  const duration = track.data?.duration || 1;
  for (let i = 0; i <= 4; i++) {
    const x = left + (right-left) * i / 4;
    chart.append(svg('line', {x1:x, x2:x, y1:7, y2:63, stroke:'#262c30'}));
    if (width > 280 || i % 2 === 0) chart.append(svg('text', {x, y:82, 'text-anchor':i === 0 ? 'start' : i === 4 ? 'end' : 'middle', fill:'#909ba5', 'font-size':8, 'font-family':'monospace'}, `${(duration*i/4).toFixed(2)}${i === 4 ? ' s' : ''}`));
  }
  if (track.data) {
    const samples = track.data.samples, bins = Math.max(1, Math.floor(right-left)), path = [];
    for (let i = 0; i < bins; i++) {
      const start = Math.floor(i * samples.length / bins), end = Math.max(start + 1, Math.floor((i+1) * samples.length / bins));
      let min = 1, max = -1;
      for (let j = start; j < Math.min(end, samples.length); j++) { min = Math.min(min, samples[j]); max = Math.max(max, samples[j]); }
      const x = left + i * (right-left) / bins;
      path.push(`M${x.toFixed(1)},${(center-max*amplitude).toFixed(1)}V${(center-min*amplitude).toFixed(1)}`);
    }
    chart.append(svg('path', {d:path.join(''), stroke:track.color, 'stroke-width':.8, fill:'none', 'data-wave':'true'}));
  } else {
    chart.append(svg('text', {x:(left+right)/2, y:39, 'text-anchor':'middle', fill:'#a2abb3', 'font-size':9, 'font-family':'monospace'}, track.loading ? 'LOADING' : track.failed ? 'WAVEFORM UNAVAILABLE' : '—'));
  }
  track.cursor = svg('line', {x1:left, x2:left, y1:7, y2:63, stroke:'#eef0f2', 'stroke-width':1, opacity:0});
  track.bounds = {left, right}; chart.append(track.cursor);
  syncTrack(track);
}
function syncTrack(track) {
  const audio = $(track.id), playing = !audio.paused && !audio.ended;
  const button = $(track.button), duration = audio.duration;
  button.textContent = playing ? 'Ⅱ Pause' : track.id === 'transition' ? '▶ Play all 5 steps' : '▶ Play';
  button.setAttribute('aria-pressed', String(playing));
  button.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} ${track.label}`);
  $(track.time).textContent = Number.isFinite(duration) ? `${audio.currentTime.toFixed(2)} / ${duration.toFixed(2)} s` : '—';
  if (track.cursor) {
    const ratio = Number.isFinite(duration) && duration > 0 ? Math.min(1, audio.currentTime / duration) : 0;
    const x = track.bounds.left + ratio * (track.bounds.right-track.bounds.left);
    track.cursor.setAttribute('x1', x); track.cursor.setAttribute('x2', x);
    track.cursor.setAttribute('opacity', audio.currentTime > 0 ? .85 : 0);
  }
}
function setTrack(id, url) {
  const track = tracks[id], audio = $(id);
  track.controller?.abort(); track.controller = new AbortController();
  track.data = null; track.loading = !!url; track.failed = false;
  $(track.button).disabled = !url;
  if (track.download) {
    $(track.download).hidden = !url;
    if (url) $(track.download).href = url; else $(track.download).removeAttribute('href');
  }
  if (url) audio.src = url; else audio.removeAttribute('src');
  audio.load(); drawWave(track); syncTrack(track);
  if (!url || !track.wave) return;
  const controller = track.controller;
  fetch(url, {signal:controller.signal}).then(response => {
    if (!response.ok) throw new Error('Audio unavailable');
    return response.arrayBuffer();
  }).then(buffer => {
    if (controller.signal.aborted) return;
    track.data = decodeWave(buffer); track.loading = false; drawWave(track);
  }).catch(error => {
    if (controller.signal.aborted) return;
    track.loading = false; track.failed = true; drawWave(track);
  });
}
for (const [id, track] of Object.entries(tracks)) {
  track.id = id;
  const audio = $(id);
  $(track.button).onclick = () => {
    if (!audio.paused && !audio.ended) { audio.pause(); return; }
    pauseAll();
    if (audio.ended) audio.currentTime = 0;
    audio.play().catch(() => status('Press Play to try again.', true));
  };
  const refresh = () => syncTrack(track);
  for (const event of ['loadedmetadata', 'durationchange', 'timeupdate', 'pause', 'ended', 'emptied']) audio.addEventListener(event, refresh);
  audio.addEventListener('play', () => {
    cancelAnimationFrame(track.frame);
    const animate = () => { syncTrack(track); if (!audio.paused && !audio.ended) track.frame = requestAnimationFrame(animate); };
    animate();
  });
  for (const event of ['pause', 'ended', 'emptied']) audio.addEventListener(event, () => cancelAnimationFrame(track.frame));
  drawWave(track);
}
function status(message, error = false) { $('status').textContent = message; $('status').classList.toggle('error', error); }
function enabled(value) {
  busy = !value;
  for (const id of ['sample', 'attribute', 'increase', 'decrease', 'generate']) $(id).disabled = !value;
  $('generate').textContent = value ? 'Load result' : 'Loading…';
}
function requestKey() {
  return `${$('sample').value}/${$('attribute').value}/${direction === 1 ? 'increase' : 'decrease'}`;
}
function updateRequest() {
  $('request-scale').textContent = `${direction > 0 ? '+' : '−'}1.0 IQR`;
  const data = config.requests[requestKey()];
  $('request-values').textContent = data ? `Δ ${signed(direction * data.iqr, 3)}` : 'Δ unavailable';
  $('increase').classList.toggle('active', direction === 1);
  $('decrease').classList.toggle('active', direction === -1);
  $('increase').setAttribute('aria-pressed', String(direction === 1));
  $('decrease').setAttribute('aria-pressed', String(direction === -1));
}
function clearResult() {
  pauseAll(); result = null;
  for (const id of ['result-audio', 'transition']) setTrack(id, null);
  $('interpolation').hidden = $('measurements').hidden = true;
  $('empty').hidden = false;
  $('result-title').textContent = 'Choose a result';
  $('result-caption').textContent = '';
  status('Ready');
}
function changeSample() {
  clearResult();
  const sample = config.samples.find(item => item.id === $('sample').value);
  setTrack('original', sample.original);
  $('original-title').textContent = sample.name;
  updateRequest();
}
$('sample').onchange = changeSample;
$('attribute').onchange = () => { clearResult(); updateRequest(); };
for (const [id, value] of [['increase', 1], ['decrease', -1]]) $(id).onclick = () => {
  if (direction !== value) { direction = value; clearResult(); updateRequest(); }
};
function svg(tag, attributes, text) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  if (text !== undefined) element.textContent = text;
  return element;
}
function plot(index) {
  const chart = $('plot'); chart.replaceChildren();
  const width = Math.max(chart.clientWidth, 280);
  chart.setAttribute('viewBox', `0 0 ${width} 170`);
  const values = result.steps.map(step => step.value);
  const valid = [...values, result.target].filter(Number.isFinite);
  if (!valid.length) return;
  const low = Math.min(...valid), high = Math.max(...valid);
  const span = Math.max(high - low, 1), bottom = low - span * .18, top = high + span * .25;
  const left = 48, right = width - 18;
  const x = i => left + i * (right - left) / 4, y = value => 132 - (value - bottom) / (top - bottom) * 116;
  for (let tick = 0; tick < 3; tick++) {
    const value = low + tick * (high - low) / 2;
    chart.append(svg('line', {x1:left, x2:right, y1:y(value), y2:y(value), stroke:'#30373d'}));
    chart.append(svg('text', {x:left - 8, y:y(value) + 3, 'text-anchor':'end', fill:'#a2abb3', 'font-size':9, 'font-family':'monospace'}, fmt(value, 1)));
  }
  if (Number.isFinite(result.target)) {
    chart.append(svg('line', {x1:left, x2:right, y1:y(result.target), y2:y(result.target), stroke:'#b7c0c7', 'stroke-dasharray':'4 4'}));
  }
  for (let i = 0; i < values.length; i++) {
    chart.append(svg('line', {x1:x(i), x2:x(i), y1:12, y2:134, stroke:'#262c30'}));
    chart.append(svg('text', {x:x(i), y:155, 'text-anchor':'middle', fill:'#a2abb3', 'font-size':9, 'font-family':'monospace'}, `${i * 25}%`));
    if (!Number.isFinite(values[i])) continue;
    if (i && Number.isFinite(values[i-1])) chart.append(svg('line', {x1:x(i-1), x2:x(i), y1:y(values[i-1]), y2:y(values[i]), stroke:'#d8b879', 'stroke-width':1.5}));
    const size = i === index ? 8 : 5;
    chart.append(svg('rect', {x:x(i)-size/2, y:y(values[i])-size/2, width:size, height:size, fill:i === index ? '#f1d7a7' : '#d8b879', stroke:'#101214', 'stroke-width':1}));
  }
}
window.addEventListener('resize', () => { Object.values(tracks).forEach(drawWave); if (result) plot(Number($('position').value)); });
function showStep(index, play = false) {
  if (!result) return;
  pauseAll();
  const step = result.steps[index], percent = Math.round(step.position * 100);
  $('position').value = index; $('position-label').textContent = `${percent}%`;
  setTrack('result-audio', step.audio);
  $('result-title').textContent = `${percent === 0 ? 'Reconstructed' : percent === 100 ? 'Generated' : 'Interpolated'} · ${percent}%`;
  $('result-caption').textContent = `${result.attribute} ${result.direction > 0 ? '↑ increase' : '↓ decrease'}`;
  $('steps').querySelectorAll('button').forEach((button, i) => { button.classList.toggle('active', i === index); button.setAttribute('aria-pressed', String(i === index)); });
  $('baseline-value').textContent = fmt(result.baseline_value);
  $('target-value').textContent = fmt(result.target);
  $('measured-label').textContent = `Measured · ${percent}%`;
  $('measured-value').textContent = fmt(step.value);
  $('change-value').textContent = signed(step.change_iqr);
  $('current-heading').textContent = `Measured · ${percent}%`;
  $('values').replaceChildren();
  const row = document.createElement('tr');
  row.className = 'selected';
  const cells = [result.attribute, fmt(result.iqr), fmt(result.original_value), fmt(result.baseline_value),
    fmt(result.target), fmt(step.value), signed(step.change_iqr)];
  for (const value of cells) { const cell = document.createElement('td'); cell.textContent = value; row.append(cell); }
  $('values').append(row);
  plot(index);
  if (play) $('result-audio').play().catch(() => status('Press Play to listen.'));
}
$('position').oninput = () => showStep(Number($('position').value));
function showResult(data) {
  result = data;
  $('empty').hidden = true; $('interpolation').hidden = $('measurements').hidden = false;
  $('steps').replaceChildren();
  data.steps.forEach((step, index) => {
    const button = document.createElement('button');
    button.textContent = `${Math.round(step.position * 100)}%`;
    button.onclick = () => showStep(index, true);
    button.setAttribute('aria-label', `Play the ${Math.round(step.position * 100)}% step`);
    $('steps').append(button);
  });
  setTrack('transition', data.transition);
  $('measurement-title').textContent = `AudioCommons · ${data.attribute}`;
  $('endpoint-error').textContent = `Final target error: ${fmt(data.endpoint_absolute_error, 3)}`;
  showStep(4);
}
$('generate').onclick = () => {
  if (busy) return;
  clearResult();
  const data = config.requests[requestKey()];
  if (!data) { status('This result is unavailable. Please refresh.', true); return; }
  showResult(data);
  const missing = !Number.isFinite(data.target) || data.steps.some(step => !Number.isFinite(step.value));
  status(missing ? 'Loaded · some measurements unavailable' : 'Loaded · precomputed result');
};
async function initialize() {
  try {
    const response = await fetch('catalog.json');
    if (!response.ok) throw new Error('Could not load the demo. Please refresh.');
    config = await response.json();
    if (!config.samples.length) throw new Error('Samples are unavailable. Please try again later.');
    for (const name of ['Kick', 'Snare', 'Hi-hat']) {
      const group = document.createElement('optgroup'); group.label = name;
      config.samples.filter(item => item.class_name === name).forEach(item => group.append(new Option(item.name, item.id)));
      if (group.children.length) $('sample').append(group);
    }
    config.axes.forEach(axis => $('attribute').append(new Option(axis.name, axis.name)));
    $('sample-count').textContent = `${config.samples.length} SOURCES`;
    $('selection-summary').textContent = ['Kick', 'Snare', 'Hi-hat'].map(name => `${name.toUpperCase()} ${config.samples.filter(item => item.class_name === name).length}`).join(' / ');
    enabled(true); changeSample();
  } catch (error) { status(error.message, true); }
}
initialize();
