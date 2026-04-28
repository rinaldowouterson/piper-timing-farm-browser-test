//#region src/worker/process-piper-synthesis.worker.ts
var e = null, t = null, n = null, r = null, i = -1, a = "CPU", o = "", s = 0, c = null, l = () => `[PiperWorker:${i}:${a}]`;
function u(e, t) {
	self.postMessage({
		type: "log",
		payload: {
			level: e,
			message: t,
			workerId: i,
			timestamp: Date.now()
		}
	});
}
var d = (e, ...t) => {
	let n = `${l()} ${e}`;
	console.log(n, ...t), u("info", e + (t.length ? " " + JSON.stringify(t) : ""));
}, f = (e, ...t) => {
	let n = `${l()} ${e}`;
	console.warn(n, ...t), u("warn", e + (t.length ? " " + JSON.stringify(t) : ""));
}, p = (e, ...t) => {
	let n = `${l()} ${e}`;
	console.error(n, ...t), u("error", e + (t.length ? " " + JSON.stringify(t) : ""));
};
self.onmessage = async (e) => {
	let t = e.data;
	try {
		switch (t.type) {
			case "init":
				await m(t.config);
				break;
			case "load-callback":
				await h(t.useCallback);
				break;
			case "synthesize":
				await g(t.text, t.requestId, {
					speed: t.speed,
					volume: t.volume,
					speakerId: t.speakerId
				});
				break;
		}
	} catch (e) {
		let n = C(e);
		p("Uncaught worker error:", n), S({
			type: "error",
			instanceId: i,
			error: n,
			originalRequest: t
		});
	}
};
async function m(n) {
	let { modelId: a, onnxRuntimePaths: c, piperPaths: l, instanceId: u, useCallback: f, defaultSpeakerId: m } = n;
	i = u || 0, o = a, s = m || 0, d(`=== INIT START [${a}] ===`, {
		useCallback: f,
		defaultSpeakerId: s
	});
	try {
		let n = await fetch(`/piper-gate/voices/${a}.onnx.json`);
		if (!n.ok) throw Error(`Failed to fetch model config: ${n.statusText}`);
		let o = await n.text();
		r = JSON.parse(o);
		let s = await fetch(`/piper-gate/voices/${a}.onnx`);
		if (!s.ok) throw Error(`Failed to fetch model: ${s.statusText}`);
		let u = await s.arrayBuffer(), p = await fetch(c.mjs);
		if (!p.ok) throw Error(`Failed to fetch ORT glue: ${p.statusText}`);
		await p.text();
		let m = await import(
			/* @vite-ignore */
			c.mjs
);
		if (t = m.default || m, !t || !t.env) throw Error("Invalid ONNX Runtime module: 'env' is missing. Check if the .mjs URL is correct.");
		t.env.wasm.wasmPaths = c.wasm, t.env.wasm.numThreads = 1, e = await t.InferenceSession.create(u, {
			executionProviders: ["wasm"],
			graphOptimizationLevel: "all"
		}), await v(l), f && await h(!0), d("=== INIT COMPLETE ==="), S({
			type: "ready",
			instanceId: i
		});
	} catch (e) {
		let t = e instanceof Error ? e : Error(String(e));
		throw p("Init failed:", t.message), t;
	}
}
async function h(e) {
	if (!e) {
		c &&= (d("Callback disabled via surgical toggle"), null);
		return;
	}
	let t = new URL("/piper-callback.js", self.location.href).href;
	d(`Loading sovereign callback: ${t}`);
	try {
		let e = await fetch(t);
		if (!e.ok) {
			let t = await e.text().catch(() => e.statusText);
			throw Error(`Gateway Error (${e.status}): ${t}`);
		}
		if (c = (await import(
			/* @vite-ignore */
			t
)).onSynthesisComplete, typeof c != "function") throw Error(`Export 'onSynthesisComplete' is not a function in ${t}`);
		d("Sovereign callback loaded successfully"), S({
			type: "callback-loaded",
			instanceId: i
		});
	} catch (e) {
		c = null;
		let t = e instanceof Error ? e.message : String(e);
		throw p("Failed to load sovereign callback module:", t), S({
			type: "callback-failed",
			instanceId: i,
			error: t
		}), e;
	}
}
async function g(a, s, l) {
	if (!e || !t || !n || !r) throw Error("Worker not initialized");
	let u = performance.now(), { phonemeIds: d, phonemes: f } = y(a, r.espeak.voice), m = x(l.speakerId, r), { audio: h, durations: g } = await b(t, d, l, m);
	if (!g || g.length === 0) throw Error("Durations missing from inference results. Ensure the model is patched to export durations tensor.");
	let _ = 256 / r.audio.sample_rate * 1e3;
	for (let e = 0; e < g.length; e++) g[e] *= _;
	let v = l.volume ?? 1;
	if (v !== 1) for (let e = 0; e < h.length; e++) h[e] *= v;
	let C = h.length / r.audio.sample_rate * 1e3, T = performance.now() - u, E = {
		requestId: s,
		audioData: h,
		sampleRate: r.audio.sample_rate,
		durationMs: C,
		metadata: {
			generationTimeMs: T,
			modelId: o,
			speakerId: m,
			phonemeIds: d,
			phonemes: f,
			durations: g || void 0,
			totalAudioDurationMs: C,
			sampleRate: r.audio.sample_rate,
			hopSize: 256
		}
	}, D;
	if (c) try {
		D = await c(E);
	} catch (e) {
		let t = e instanceof Error ? e : Error(String(e));
		throw p(`Callback execution failed: ${t.message}`), Error(`User callback '${o}' failed: ${t.message}`);
	}
	let O = [h.buffer, ...w(D)];
	S({
		type: "success",
		instanceId: i,
		requestId: s,
		result: E,
		callbackResult: D
	}, { transfer: O });
}
var _ = null;
async function v(e) {
	let t = e.piperJs, r = await fetch(t);
	if (!r.ok) throw Error(`Failed to fetch phonemizer glue: ${r.statusText}`);
	let i = await r.text();
	n = await Function(i + "; return createPiperPhonemize;")()({
		locateFile: (t) => t.endsWith(".wasm") ? e.piperWasm : t.endsWith(".data") ? e.piperData : t,
		print: (e) => {
			try {
				_ = JSON.parse(e);
			} catch {}
		}
	});
}
function y(e, t) {
	let r = JSON.stringify([{ text: e.trim() }]);
	if (_ = null, n?.callMain([
		"-l",
		t,
		"--input",
		r,
		"--espeak_data",
		"/espeak-ng-data"
	]), _ && _.phoneme_ids !== void 0) {
		let e = _;
		return {
			phonemeIds: e.phoneme_ids,
			phonemes: e.phonemes || []
		};
	}
	throw Error("Phonemization failed");
}
async function b(t, n, i, a) {
	let { noise_scale: o, length_scale: s, noise_w: c } = r.inference, l = {
		input: new t.Tensor("int64", BigInt64Array.from(n.map(BigInt)), [1, n.length]),
		input_lengths: new t.Tensor("int64", BigInt64Array.from([BigInt(n.length)])),
		scales: new t.Tensor("float32", new Float32Array([
			o,
			i.speed ? s / i.speed : s,
			c
		]))
	};
	Object.keys(r.speaker_id_map).length > 0 && (l.sid = new t.Tensor("int64", BigInt64Array.from([BigInt(a)])));
	let u = await e.run(l);
	return {
		audio: u.output.data,
		durations: u.durations ? u.durations.data : null
	};
}
function x(e, t) {
	let n = Object.keys(t.speaker_id_map).length;
	if (n === 0) return 0;
	let r = e ?? s;
	return r < 0 || r >= n ? (f(`speakerId ${r} out of range (0-${n - 1}), falling back to 0`), 0) : r;
}
function S(e, t) {
	self.postMessage(e, t);
}
function C(e) {
	if (typeof e == "string") return e;
	let t = e instanceof Error ? e.message : String(e);
	if (e && typeof e == "object" && "originalRequest" in e) try {
		let n = { ...e.originalRequest };
		return "text" in n && (n.text = "[REDACTED]"), `${t} (Request: ${JSON.stringify(n)})`;
	} catch {
		return t;
	}
	return t;
}
//#endregion
//#region src/worker/index.ts
function w(e) {
	let t = [];
	function n(e) {
		if (e) {
			if (e instanceof ArrayBuffer) t.push(e);
			else if (ArrayBuffer.isView(e)) t.push(e.buffer);
			else if (typeof e == "object") for (let t in e) n(e[t]);
		}
	}
	return n(e), t;
}
//#endregion
export { w as collectTransferables, g as processPiperSynthesis, m as setupPiperWorker };
