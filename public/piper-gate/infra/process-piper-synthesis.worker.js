import { t as e } from "./assets/resolve-gateway-path.js";
//#region src/worker/process-piper-synthesis.worker.ts
var t = null, n = null, r = null, i = null, a = -1, o = "CPU", s = "", c = 0, l = -1, u = null, d = () => `[PiperWorker:${a}:${o}]`, f = !1;
function p(e, t) {
	self.postMessage({
		type: "log",
		payload: {
			level: e,
			message: t,
			workerId: a,
			timestamp: Date.now()
		}
	});
}
var m = (e, ...t) => {
	let n = `${d()} ${e}`;
	f && console.log(n, ...t), p("info", e + (t.length ? " " + JSON.stringify(t) : ""));
}, h = (e, ...t) => {
	let n = `${d()} ${e}`;
	f && console.warn(n, ...t), p("warn", e + (t.length ? " " + JSON.stringify(t) : ""));
}, g = (e, ...t) => {
	let n = `${d()} ${e}`;
	f && console.error(n, ...t), p("error", e + (t.length ? " " + JSON.stringify(t) : ""));
};
self.onmessage = async (e) => {
	let t = e.data;
	try {
		switch (t.type) {
			case "init":
				l = t.configCounter, await b(t.config);
				break;
			case "load-callback":
				l = t.configCounter, await x(t.useCallback);
				break;
			case "synthesize":
				await S(t.text, t.requestId, {
					speed: t.speed,
					volume: t.volume,
					speakerId: t.speakerId
				});
				break;
		}
	} catch (e) {
		let n = k(e);
		g("Uncaught worker error:", n), O({
			type: "error",
			instanceId: a,
			error: n,
			originalRequest: t
		});
	}
};
var _ = {
	wasm: "/piper-gate/infra/",
	mjs: "/piper-gate/infra/ort.wasm.min.mjs"
}, v = {
	piperData: "/piper-gate/infra/piper_phonemize.data",
	piperJs: "/piper-gate/infra/piper_phonemize.js",
	piperWasm: "/piper-gate/infra/piper_phonemize.wasm"
};
function y(t) {
	let n = e(t);
	_ = n.onnx, v = {
		piperData: n.phonemize.data,
		piperJs: n.phonemize.js,
		piperWasm: n.phonemize.wasm
	};
}
async function b(e) {
	let { modelId: r, instanceId: o, useCallback: u, defaultSpeakerId: d, debug: p, gatewayPath: h } = e;
	h && y(h), a = o || 0, s = r, c = d || 0, f = p ?? !1, m(`=== INIT START [${r}] ===`, {
		useCallback: u,
		defaultSpeakerId: c
	});
	try {
		let o = `${e.gatewayPath || "/piper-gate/"}voices/`, s = await fetch(`${o}${r}.onnx.json`);
		if (!s.ok) throw Error(`Failed to fetch model config: ${s.statusText}`);
		i = await s.json();
		let c = await fetch(`${o}${r}.onnx`);
		if (!c.ok) throw Error(`Failed to fetch model: ${c.statusText}`);
		let d = await c.arrayBuffer(), f = await fetch(_.mjs);
		if (!f.ok) throw Error(`Failed to fetch ORT glue: ${f.statusText}`);
		await f.text();
		let p = await import(
			/* @vite-ignore */
			_.mjs
		);
		if (n = p.default || p, !n || !n.env) throw Error("Invalid ONNX Runtime module: 'env' is missing. Check if the .mjs URL is correct.");
		n.env.wasm.wasmPaths = _.wasm, n.env.wasm.numThreads = 1, t = await n.InferenceSession.create(d, {
			executionProviders: ["wasm"],
			graphOptimizationLevel: "all"
		}), await w(v), u && await x(!0), m("=== INIT COMPLETE ==="), O({
			type: "ready",
			instanceId: a,
			configCounter: l
		});
	} catch (e) {
		let t = e instanceof Error ? e : Error(String(e));
		throw g("Init failed:", t.message), t;
	}
}
async function x(e) {
	if (!e) {
		u &&= (m("Callback disabled via surgical toggle"), null), O({
			type: "callback-off",
			instanceId: a,
			configCounter: l
		});
		return;
	}
	let t = new URL("./piper-callback.js", self.location.href).href;
	m(`Loading synthesis callback: ${t}`);
	try {
		let e = await fetch(t);
		if (!e.ok) {
			let t = await e.text().catch(() => e.statusText);
			throw Error(`Gateway Error (${e.status}): ${t}`);
		}
		if (u = (await import(
			/* @vite-ignore */
			t
		)).onSynthesisComplete, typeof u != "function") throw Error(`Export 'onSynthesisComplete' is not a function in ${t}`);
		m("Synthesis callback loaded successfully"), O({
			type: "callback-on",
			instanceId: a,
			configCounter: l
		});
	} catch (e) {
		u = null;
		let t = e instanceof Error ? e.message : String(e);
		throw g("Failed to load synthesis callback module:", t), O({
			type: "callback-failed",
			instanceId: a,
			error: t
		}), e;
	}
}
async function S(e, o, c) {
	if (!t || !n || !r || !i) throw Error("Worker not initialized");
	let l = performance.now(), { phonemeIds: d, phonemes: f } = T(e, i.espeak.voice), p = D(c.speakerId, i), { audio: m, durations: h } = await E(n, d, c, p);
	if (!h || h.length === 0) throw Error("Durations missing from inference results. Ensure the model is patched to export durations tensor.");
	let _ = 256 / i.audio.sample_rate * 1e3;
	for (let e = 0; e < h.length; e++) h[e] *= _;
	let v = c.volume ?? 1;
	if (v !== 1) for (let e = 0; e < m.length; e++) m[e] *= v;
	let y = m.length / i.audio.sample_rate * 1e3, b = performance.now() - l, x = {
		requestId: o,
		audioData: m,
		sampleRate: i.audio.sample_rate,
		durationMs: y,
		metadata: {
			generationTimeMs: b,
			modelId: s,
			speakerId: p,
			phonemeIds: d,
			phonemes: f,
			durations: h,
			totalAudioDurationMs: y,
			sampleRate: i.audio.sample_rate,
			hopSize: 256
		}
	}, S;
	if (u) try {
		S = await u(x);
	} catch (e) {
		let t = e instanceof Error ? e : Error(String(e));
		throw g(`Callback execution failed: ${t.message}`), Error(`User callback '${s}' failed: ${t.message}`);
	}
	let C = [m.buffer, ...A(S)];
	O({
		type: "success",
		instanceId: a,
		requestId: o,
		result: x,
		callbackResult: S
	}, { transfer: C });
}
var C = null;
async function w(e) {
	let t = e.piperJs, n = await fetch(t);
	if (!n.ok) throw Error(`Failed to fetch phonemizer glue: ${n.statusText}`);
	let i = await n.text();
	r = await Function(i + "; return createPiperPhonemize;")()({
		locateFile: (t) => t.endsWith(".wasm") ? e.piperWasm : t.endsWith(".data") ? e.piperData : t,
		print: (e) => {
			try {
				C = JSON.parse(e);
			} catch { }
		}
	});
}
function T(e, t) {
	let n = JSON.stringify([{ text: e.trim() }]);
	if (C = null, r?.callMain([
		"-l",
		t,
		"--input",
		n,
		"--espeak_data",
		"/espeak-ng-data"
	]), C && C.phoneme_ids !== void 0) {
		let e = C;
		return {
			phonemeIds: e.phoneme_ids,
			phonemes: e.phonemes
		};
	}
	throw Error("Phonemization failed");
}
async function E(e, n, r, a) {
	let { noise_scale: o, length_scale: s, noise_w: c } = i.inference, l = {
		input: new e.Tensor("int64", BigInt64Array.from(n.map(BigInt)), [1, n.length]),
		input_lengths: new e.Tensor("int64", BigInt64Array.from([BigInt(n.length)])),
		scales: new e.Tensor("float32", new Float32Array([
			o,
			r.speed ? s / r.speed : s,
			c
		]))
	};
	Object.keys(i.speaker_id_map).length > 0 && (l.sid = new e.Tensor("int64", BigInt64Array.from([BigInt(a)])));
	let u = await t.run(l);
	return {
		audio: u.output.data,
		durations: u.durations ? u.durations.data : null
	};
}
function D(e, t) {
	let n = Object.keys(t.speaker_id_map).length;
	if (n === 0) return 0;
	let r = e ?? c;
	return r < 0 || r >= n ? (h(`speakerId ${r} out of range (0-${n - 1}), falling back to 0`), 0) : r;
}
function O(e, t) {
	self.postMessage(e, t);
}
function k(e) {
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
function A(e) {
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
export { A as collectTransferables, S as processPiperSynthesis, b as setupPiperWorker };
