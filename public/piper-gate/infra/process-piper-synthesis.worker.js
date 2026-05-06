//#region src/worker/process-piper-synthesis.worker.ts
var e = null, t = null, n = null, r = null, i = -1, a = "CPU", o = "", s = 0, c = -1, l = null, u = () => `[PiperWorker:${i}:${a}]`;
function d(e, t) {
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
var f = (e, ...t) => {
	let n = `${u()} ${e}`;
	console.log(n, ...t), d("info", e + (t.length ? " " + JSON.stringify(t) : ""));
}, p = (e, ...t) => {
	let n = `${u()} ${e}`;
	console.warn(n, ...t), d("warn", e + (t.length ? " " + JSON.stringify(t) : ""));
}, m = (e, ...t) => {
	let n = `${u()} ${e}`;
	console.error(n, ...t), d("error", e + (t.length ? " " + JSON.stringify(t) : ""));
};
self.onmessage = async (e) => {
	let t = e.data;
	try {
		switch (t.type) {
			case "init":
				c = t.configCounter, await _(t.config);
				break;
			case "load-callback":
				c = t.configCounter, await v(t.useCallback);
				break;
			case "synthesize":
				await y(t.text, t.requestId, {
					speed: t.speed,
					volume: t.volume,
					speakerId: t.speakerId
				});
				break;
		}
	} catch (e) {
		let n = E(e);
		m("Uncaught worker error:", n), T({
			type: "error",
			instanceId: i,
			error: n,
			originalRequest: t
		});
	}
};
var h = {
	wasm: "/piper-gate/infra/",
	mjs: "/piper-gate/infra/ort.wasm.min.mjs"
}, g = {
	piperData: "/piper-gate/infra/piper_phonemize.data",
	piperJs: "/piper-gate/infra/piper_phonemize.js",
	piperWasm: "/piper-gate/infra/piper_phonemize.wasm"
};
async function _(n) {
	let { modelId: a, instanceId: l, useCallback: u, defaultSpeakerId: d } = n;
	i = l || 0, o = a, s = d || 0, f(`=== INIT START [${a}] ===`, {
		useCallback: u,
		defaultSpeakerId: s
	});
	try {
		let n = await fetch(`/piper-gate/voices/${a}.onnx.json`);
		if (!n.ok) throw Error(`Failed to fetch model config: ${n.statusText}`);
		let o = await n.text();
		r = JSON.parse(o);
		let s = await fetch(`/piper-gate/voices/${a}.onnx`);
		if (!s.ok) throw Error(`Failed to fetch model: ${s.statusText}`);
		let l = await s.arrayBuffer(), d = await fetch(h.mjs);
		if (!d.ok) throw Error(`Failed to fetch ORT glue: ${d.statusText}`);
		await d.text();
		let p = await import(
			/* @vite-ignore */
			h.mjs
);
		if (t = p.default || p, !t || !t.env) throw Error("Invalid ONNX Runtime module: 'env' is missing. Check if the .mjs URL is correct.");
		t.env.wasm.wasmPaths = h.wasm, t.env.wasm.numThreads = 1, e = await t.InferenceSession.create(l, {
			executionProviders: ["wasm"],
			graphOptimizationLevel: "all"
		}), await x(g), u && await v(!0), f("=== INIT COMPLETE ==="), T({
			type: "ready",
			instanceId: i,
			configCounter: c
		});
	} catch (e) {
		let t = e instanceof Error ? e : Error(String(e));
		throw m("Init failed:", t.message), t;
	}
}
async function v(e) {
	if (!e) {
		l &&= (f("Callback disabled via surgical toggle"), null), T({
			type: "callback-off",
			instanceId: i,
			configCounter: c
		});
		return;
	}
	let t = new URL("./piper-callback.js", self.location.href).href;
	f(`Loading synthesis callback: ${t}`);
	try {
		let e = await fetch(t);
		if (!e.ok) {
			let t = await e.text().catch(() => e.statusText);
			throw Error(`Gateway Error (${e.status}): ${t}`);
		}
		if (l = (await import(
			/* @vite-ignore */
			t
)).onSynthesisComplete, typeof l != "function") throw Error(`Export 'onSynthesisComplete' is not a function in ${t}`);
		f("Synthesis callback loaded successfully"), T({
			type: "callback-on",
			instanceId: i,
			configCounter: c
		});
	} catch (e) {
		l = null;
		let t = e instanceof Error ? e.message : String(e);
		throw m("Failed to load synthesis callback module:", t), T({
			type: "callback-failed",
			instanceId: i,
			error: t
		}), e;
	}
}
async function y(a, s, c) {
	if (!e || !t || !n || !r) throw Error("Worker not initialized");
	let u = performance.now(), { phonemeIds: d, phonemes: f } = S(a, r.espeak.voice), p = w(c.speakerId, r), { audio: h, durations: g } = await C(t, d, c, p);
	if (!g || g.length === 0) throw Error("Durations missing from inference results. Ensure the model is patched to export durations tensor.");
	let _ = 256 / r.audio.sample_rate * 1e3;
	for (let e = 0; e < g.length; e++) g[e] *= _;
	let v = c.volume ?? 1;
	if (v !== 1) for (let e = 0; e < h.length; e++) h[e] *= v;
	let y = h.length / r.audio.sample_rate * 1e3, b = performance.now() - u, x = {
		requestId: s,
		audioData: h,
		sampleRate: r.audio.sample_rate,
		durationMs: y,
		metadata: {
			generationTimeMs: b,
			modelId: o,
			speakerId: p,
			phonemeIds: d,
			phonemes: f,
			durations: g || void 0,
			totalAudioDurationMs: y,
			sampleRate: r.audio.sample_rate,
			hopSize: 256
		}
	}, E;
	if (l) try {
		E = await l(x);
	} catch (e) {
		let t = e instanceof Error ? e : Error(String(e));
		throw m(`Callback execution failed: ${t.message}`), Error(`User callback '${o}' failed: ${t.message}`);
	}
	let O = [h.buffer, ...D(E)];
	T({
		type: "success",
		instanceId: i,
		requestId: s,
		result: x,
		callbackResult: E
	}, { transfer: O });
}
var b = null;
async function x(e) {
	let t = e.piperJs, r = await fetch(t);
	if (!r.ok) throw Error(`Failed to fetch phonemizer glue: ${r.statusText}`);
	let i = await r.text();
	n = await Function(i + "; return createPiperPhonemize;")()({
		locateFile: (t) => t.endsWith(".wasm") ? e.piperWasm : t.endsWith(".data") ? e.piperData : t,
		print: (e) => {
			try {
				b = JSON.parse(e);
			} catch {}
		}
	});
}
function S(e, t) {
	let r = JSON.stringify([{ text: e.trim() }]);
	if (b = null, n?.callMain([
		"-l",
		t,
		"--input",
		r,
		"--espeak_data",
		"/espeak-ng-data"
	]), b && b.phoneme_ids !== void 0) {
		let e = b;
		return {
			phonemeIds: e.phoneme_ids,
			phonemes: e.phonemes || []
		};
	}
	throw Error("Phonemization failed");
}
async function C(t, n, i, a) {
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
function w(e, t) {
	let n = Object.keys(t.speaker_id_map).length;
	if (n === 0) return 0;
	let r = e ?? s;
	return r < 0 || r >= n ? (p(`speakerId ${r} out of range (0-${n - 1}), falling back to 0`), 0) : r;
}
function T(e, t) {
	self.postMessage(e, t);
}
function E(e) {
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
function D(e) {
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
export { D as collectTransferables, y as processPiperSynthesis, _ as setupPiperWorker };
