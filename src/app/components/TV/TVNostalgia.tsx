"use client";

import { useEffect, useRef, useCallback, useMemo } from 'react'; // Added useCallback and useMemo
import styles from './TVNostalgia.module.css';

// Moved VCREffect class outside the component to avoid recreation on every render
class VCREffect {
    public vcrInterval: number | null = null; // Changed from private to public
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    public config: { // Changed from private to public
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
        this.ctx = canvas.getContext("2d")!;
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
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.style.position = "absolute";
        this.canvas.style.top = "0";
        this.canvas.style.left = "0";
        this.canvas.style.opacity = this.config.opacity.toString();

        this.generateVCRNoise();
        window.addEventListener("resize", () => this.onResize());
    }

    private onResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    private generateVCRNoise() {
        if (this.vcrInterval !== null) {
            if (this.config.fps >= 60) {
                cancelAnimationFrame(this.vcrInterval);
            } else {
                clearInterval(this.vcrInterval);
            }
        }

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
}

const TVNostalgia = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const snowEffectRef = useRef<HTMLDivElement>(null);
    const vcrEffectRef = useRef<VCREffect | null>(null);

    // Wrapped videoIds in useMemo to prevent recreation on every render
    const videoIds = useMemo(() => [
        "dG2yaHAqTVM",
        "UTKfL9W6j3s",
        "0oQXAxIyZAg",
        "0522U6b6rBU",
        "G5ZIg5KD5G8",
        "iphbVjnNuyU",
        "4f5whz4UBfQ"
    ], []);

    const currentVideoIndex = useRef(0);

    const switchToNextVideo = useCallback(() => {
        if (!snowEffectRef.current || !iframeRef.current) return;
        
        snowEffectRef.current.style.opacity = '1';
        setTimeout(() => {
            currentVideoIndex.current = (currentVideoIndex.current + 1) % videoIds.length;
            iframeRef.current!.src = `https://www.youtube.com/embed/${videoIds[currentVideoIndex.current]}?autoplay=1&controls=0&loop=1&mute=1`;
            snowEffectRef.current!.style.opacity = '0';
        }, 2000);
    }, [videoIds]);

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
        const iframe = iframeRef.current;
        if (iframe) {
            const handleLoad = () => {
                setTimeout(switchToNextVideo, 20000);
            };
            iframe.addEventListener('load', handleLoad);
            return () => {
                iframe.removeEventListener('load', handleLoad);
                // Clean up VCR effect
                if (vcrEffectRef.current && vcrEffectRef.current.vcrInterval !== null) {
                    if (vcrEffectRef.current.config.fps >= 60) {
                        cancelAnimationFrame(vcrEffectRef.current.vcrInterval);
                    } else {
                        clearInterval(vcrEffectRef.current.vcrInterval);
                    }
                }
            };
        }
    }, [switchToNextVideo]);

    return (
        <div className={styles.container}>
            <div className={styles.tvScreen}></div>
            <div className={styles.tvContainer}>
                <canvas ref={canvasRef} className={styles.canvas}></canvas>
                <iframe
                    ref={iframeRef}
                    className={styles.iframe}
                    width="720"
                    height="540"
                    src={`https://www.youtube.com/embed/${videoIds[0]}?autoplay=1&controls=0&loop=1&mute=1`}
                    frameBorder="0"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                ></iframe>
                <div className={styles.glitch}></div>
                <div className={styles.scanLines}></div>
                <div ref={snowEffectRef} className={styles.snowEffect}></div>
            </div>
        </div>
    );
};

export default TVNostalgia;