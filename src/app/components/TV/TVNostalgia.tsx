"use client";

import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import styles from './TVNostalgia.module.css';

class VCREffect {
    public vcrInterval: number | null = null;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    public config: {
        fps: number;
        blur: number;
        opacity: number;
        miny: number;
        miny2: number;
        num: number;
    };

    constructor(canvas: HTMLCanvasElement, options: Partial<{
        fps: number;
        blur: number;
        opacity: number;
        miny: number;
        miny2: number;
        num: number;
    }> = {}) {
        this.canvas = canvas;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Could not get canvas context");
        this.ctx = context;
        
        this.config = {
            fps: 60,
            blur: 1,
            opacity: 1,
            miny: 220,
            miny2: 220,
            num: 70,
            ...options
        };

        this.init();
    }

    private init() {
        this.updateCanvasSize();
        this.canvas.style.position = "absolute";
        this.canvas.style.top = "0";
        this.canvas.style.left = "0";
        this.canvas.style.opacity = this.config.opacity.toString();

        this.generateVCRNoise();
        window.addEventListener("resize", () => this.onResize());
    }

    private updateCanvasSize() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }

    private onResize() {
        this.updateCanvasSize();
    }

    private generateVCRNoise() {
        this.clearInterval();

        if (this.config.fps >= 60) {
            const animate = () => {
                this.renderTrackingNoise();
                this.vcrInterval = requestAnimationFrame(animate);
            };
            this.vcrInterval = requestAnimationFrame(animate);
        } else {
            this.vcrInterval = window.setInterval(() => {
                this.renderTrackingNoise();
            }, 1000 / this.config.fps);
        }
    }

    private clearInterval() {
        if (this.vcrInterval !== null) {
            if (this.config.fps >= 60) {
                cancelAnimationFrame(this.vcrInterval);
            } else {
                clearInterval(this.vcrInterval);
            }
            this.vcrInterval = null;
        }
    }

    private renderTrackingNoise(radius = 2) {
        const { canvas, ctx, config } = this;
        const { miny, miny2, num } = config;

        canvas.style.filter = `blur(${config.blur}px)`;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = `#fff`;

        ctx.beginPath();
        for (let i = 0; i <= num; i++) {
            const x = Math.random() * canvas.width;
            const y1 = this.getRandomInt(miny + 3, canvas.height);
            const y2 = this.getRandomInt(0, miny2 - 3);
            ctx.fillRect(x, y1, radius, radius);
            ctx.fillRect(x, y2, radius, radius);
            ctx.fill();

            this.renderTail(ctx, x, y1, radius);
            this.renderTail(ctx, x, y2, radius);
        }
        ctx.closePath();
    }

    private renderTail(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
        const n = this.getRandomInt(1, 50);
        const dirs = [1, -1];
        const dir = dirs[Math.floor(Math.random() * dirs.length)];

        for (let i = 0; i < n; i++) {
            const r = this.getRandomInt(radius - 0.01, radius);
            const dx = this.getRandomInt(1, 4) * dir;
            radius -= 0.1;
            ctx.fillRect((x += dx), y, r, r);
            ctx.fill();
        }
    }

    private getRandomInt(min: number, max: number) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    public destroy() {
        this.clearInterval();
        window.removeEventListener("resize", () => this.onResize());
    }
}

const TVNostalgia = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const snowEffectRef = useRef<HTMLDivElement>(null);
    const vcrEffectRef = useRef<VCREffect | null>(null);
    const [userInteracted, setUserInteracted] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    const videoSources = useMemo(() => [
        "/assets/btv.mp4",
        "/assets/atn1.mp4",
        "/assets/boi.mp4",
        "/assets/dd.mp4",
        "/assets/ntv.mp4",
        "/assets/ekushe.mp4",
    ], []);

    const currentVideoIndex = useRef(0);

    const handleUserInteraction = useCallback(() => {
        if (!userInteracted) {
            setUserInteracted(true);
            if (videoRef.current) {
                videoRef.current.muted = false;
                videoRef.current.play().catch(e => {
                    console.error("Playback with sound failed, falling back to muted:", e);
                    videoRef.current!.muted = true;
                    videoRef.current!.play().catch(e => console.error("Muted playback failed:", e));
                });
            }
        }
    }, [userInteracted]);

    const switchToNextVideo = useCallback(async () => {
        if (!snowEffectRef.current || !videoRef.current) return;
        
        try {
            snowEffectRef.current.style.opacity = '1';
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            currentVideoIndex.current = (currentVideoIndex.current + 1) % videoSources.length;
            videoRef.current.src = videoSources[currentVideoIndex.current];
            
            await videoRef.current.play();
            snowEffectRef.current.style.opacity = '0';
            setIsPlaying(true);
        } catch (error) {
            console.error("Video playback error:", error);
            setIsPlaying(false);
        }
    }, [videoSources]);

    useEffect(() => {
        // Initialize VCR effect
        if (canvasRef.current) {
            vcrEffectRef.current = new VCREffect(canvasRef.current, {
                opacity: 1,
                miny: 220,
                miny2: 220,
                num: 70,
                fps: 60,
                blur: 1
            });
        }

        // Set up video rotation
        const video = videoRef.current;
        if (video) {
            video.src = videoSources[0];
            video.muted = true; // Start muted to allow autoplay
            video.loop = true;
            
            const playVideo = async () => {
                try {
                    await video.play();
                    setIsPlaying(true);
                } catch (error) {
                    console.error("Initial muted autoplay failed:", error);
                    setIsPlaying(false);
                }
            };

            playVideo();
            
            const rotationTimer = setInterval(switchToNextVideo, 20000);
            
            return () => {
                clearInterval(rotationTimer);
                vcrEffectRef.current?.destroy();
            };
        }
    }, [switchToNextVideo, videoSources]);

    return (
        <div className={styles.container} onClick={handleUserInteraction}>
            <div className={styles.tvScreen}></div>
            <div className={styles.tvContainer}>
                {!isPlaying && (
                    <div className={styles.playPrompt}>
                        Click anywhere to enable sound
                    </div>
                )}
                
                <canvas ref={canvasRef} className={styles.canvas}></canvas>
                <video
                    ref={videoRef}
                    className={styles.video}
                    width="720"
                    height="540"
                    muted={!userInteracted}
                    loop
                    playsInline
                    autoPlay
                />
                <div className={styles.glitch}></div>
                <div className={styles.scanLines}></div>
                <div ref={snowEffectRef} className={styles.snowEffect}></div>
            </div>
        </div>
    );
};

export default TVNostalgia;