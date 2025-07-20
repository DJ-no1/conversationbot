import React, { useEffect, useRef } from "react";

interface WaveformVisualizerProps {
    isRecording: boolean;
}

const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({ isRecording }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const animationIdRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [volume, setVolume] = React.useState<number>(0);
    const [timer, setTimer] = React.useState<number>(0);
    const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!isRecording) {
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
                animationIdRef.current = null;
            }
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
            setTimer(0);
            setVolume(0);
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            }
            return;
        }

        let mounted = true;
        setTimer(0);
        timerIntervalRef.current = setInterval(() => setTimer(t => t + 1), 1000);
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
            if (!mounted) return;
            streamRef.current = stream;
            const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            const audioContext = new AudioContextClass();
            audioContextRef.current = audioContext;
            const source = audioContext.createMediaStreamSource(stream);
            sourceRef.current = source;
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current = analyser;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            dataArrayRef.current = dataArray;
            source.connect(analyser);

            const draw = () => {
                if (!canvasRef.current || !analyserRef.current) return;
                const ctx = canvasRef.current.getContext("2d");
                if (!ctx) return;
                analyserRef.current.getByteTimeDomainData(dataArrayRef.current!);
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                ctx.lineWidth = 2;
                ctx.strokeStyle = "#4f46e5";
                ctx.beginPath();
                const sliceWidth = canvasRef.current.width / dataArrayRef.current!.length;
                let x = 0;
                let sum = 0;
                for (let i = 0; i < dataArrayRef.current!.length; i++) {
                    const v = dataArrayRef.current![i] / 128.0;
                    const y = (v * canvasRef.current.height) / 2;
                    sum += Math.abs(v - 1);
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                    x += sliceWidth;
                }
                ctx.lineTo(canvasRef.current.width, canvasRef.current.height / 2);
                ctx.stroke();
                // Volume bar calculation
                const avg = sum / dataArrayRef.current!.length;
                setVolume(avg);
                animationIdRef.current = requestAnimationFrame(draw);
            };
            draw();
        });
        return () => {
            mounted = false;
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
                animationIdRef.current = null;
            }
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
            setTimer(0);
            setVolume(0);
        };
    }, [isRecording]);

    return (
        <div style={{ width: "100%", maxWidth: 400, margin: "8px 0" }}>
            <canvas
                ref={canvasRef}
                width={300}
                height={60}
                style={{ background: "#18181b", borderRadius: 8, width: "100%" }}
            />
            {/* Volume bar */}
            <div style={{ height: 8, background: "#27272a", borderRadius: 4, marginTop: 4, position: "relative" }}>
                <div
                    style={{
                        width: `${Math.min(100, Math.round(volume * 100))}%`,
                        height: "100%",
                        background: volume > 0.2 ? (volume > 0.5 ? "#f59e42" : "#4f46e5") : "#71717a",
                        borderRadius: 4,
                        transition: "width 0.1s linear, background 0.2s"
                    }}
                />
            </div>
            {/* Timer */}
            <div style={{ textAlign: "right", fontSize: 12, color: "#a1a1aa", marginTop: 2 }}>
                {isRecording ? `Recording: ${timer}s` : null}
            </div>
        </div>
    );
};

export default WaveformVisualizer;
