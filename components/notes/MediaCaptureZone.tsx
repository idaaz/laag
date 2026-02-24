"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Image as ImageIcon, Mic, X, Trash2, StopCircle, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadNoteAttachment, type FileAttachment } from "@/lib/supabase/storage";
import { pushToast } from "@/components/ui/toast";

type MediaCaptureZoneProps = {
    userId: string;
    onAttachmentsChange: (attachments: FileAttachment[]) => void;
    onUploadingChange?: (isUploading: boolean) => void;
    initialAttachments?: FileAttachment[];
};

export function MediaCaptureZone({ userId, onAttachmentsChange, onUploadingChange, initialAttachments = [] }: MediaCaptureZoneProps) {
    console.log("DEBUG: MediaCaptureZone initialized for user:", userId);
    const [attachments, setAttachments] = useState<FileAttachment[]>(initialAttachments);
    const [mode, setMode] = useState<"idle" | "camera" | "audio">("idle");
    const [isUploading, setIsUploading] = useState(false);

    // Camera refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    // Audio refs
    const [, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const initializedRef = useRef(false);

    // Initial load sync (only when initialAttachments is populated and we haven't initialized yet)
    useEffect(() => {
        if (!initializedRef.current && initialAttachments.length > 0) {
            setAttachments(initialAttachments);
            initializedRef.current = true;
        }
    }, [initialAttachments]);

    // Only inform parent on explicit upload status change
    useEffect(() => {
        onUploadingChange?.(isUploading);
    }, [isUploading, onUploadingChange]);

    // Handle Camera Stream attachment safely after mount
    useEffect(() => {
        if (mode === "camera" && stream && videoRef.current) {
            console.log("DEBUG: Attaching stream to video element");
            videoRef.current.srcObject = stream;
        }
    }, [mode, stream]);

    // Cleanup stream on unmount
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    // Helper to safely update local state and inform parent simultaneously
    const updateAttachments = (newAttachments: FileAttachment[]) => {
        setAttachments(newAttachments);
        onAttachmentsChange(newAttachments);
    };

    // --- File Upload ---
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const isVideo = file.type.startsWith("video/");
            const mediaType = isVideo ? "video" : "image";
            const rawName = window.prompt(`Enter a name for this ${mediaType}:`, file.name) || `${mediaType}_${attachments.length + 1}`;

            setIsUploading(true);
            const attachment = await uploadNoteAttachment(userId, file, rawName, mediaType);
            updateAttachments([...attachments, attachment]);
            pushToast(`${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} uploaded successfully`);
        } catch (err) {
            console.error("DEBUG: handleFileSelect error:", err);
            pushToast("Failed to upload media", "Check your connection or console for details.");
        } finally {
            setIsUploading(false);
        }
    };

    // --- Camera Logic ---
    const startCamera = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            console.log("DEBUG: Requesting camera access...");
            const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            setStream(s);
            // We don't set videoRef.current.srcObject here because the video element 
            // might not be mounted yet. useEffect handles it.
            setMode("camera");
        } catch (err) {
            console.error("DEBUG: Camera access error:", err);
            pushToast("Camera Access Denied", "Please enable camera permissions.");
        }
    };

    const stopCamera = (e?: React.MouseEvent) => {
        e?.preventDefault();
        e?.stopPropagation();
        stream?.getTracks().forEach(track => track.stop());
        setStream(null);
        setMode("idle");
    };

    const capturePhoto = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(video, 0, 0);

        canvas.toBlob(async (blob) => {
            if (!blob) return;
            try {
                const rawName = window.prompt("Enter a name for this captured photo:", `photo_${attachments.length + 1}`) || `photo_${attachments.length + 1}`;
                setIsUploading(true);
                const attachment = await uploadNoteAttachment(userId, blob, `${rawName}.jpg`, "image");
                updateAttachments([...attachments, attachment]);
                stopCamera(e);
                pushToast("Photo captured and uploaded");
            } catch (err) {
                console.error("DEBUG: capturePhoto upload error:", err);
                pushToast("Capture failed", "Check console for details.");
            } finally {
                setIsUploading(false);
            }
        }, "image/jpeg");
    };

    // --- Audio Logic ---
    const startRecording = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const s = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(s);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                try {
                    const rawName = window.prompt("Enter a name for this voice memo:", `audio_${attachments.length + 1}`) || `audio_${attachments.length + 1}`;
                    setIsUploading(true);
                    const attachment = await uploadNoteAttachment(userId, audioBlob, `${rawName}.webm`, "audio");
                    updateAttachments([...attachments, attachment]);
                    pushToast("Voice memo saved");
                } catch (err) {
                    console.error("DEBUG: audio upload error:", err);
                    pushToast("Recording failed to upload", "Check console for details.");
                } finally {
                    setIsUploading(false);
                    s.getTracks().forEach(t => t.stop());
                }
            };

            recorder.start();
            setIsRecording(true);
            setMode("audio");
        } catch (err) {
            console.error(err);
            pushToast("Microphone Error", "Unable to access microphone.");
        }
    };

    const stopRecording = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
        setMode("idle");
    };

    const removeAttachment = (e: React.MouseEvent, index: number) => {
        e.preventDefault();
        e.stopPropagation();
        updateAttachments(attachments.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4 py-2 border-t border-white/5 mt-4">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1"> Multimedia Attachments </Label>

            <div className="flex flex-wrap gap-2">
                {attachments.map((at, i) => (
                    <div key={i} className="group relative w-16 h-16 rounded-xl bg-card/60 border border-white/5 overflow-hidden shadow-lg transition-all hover:scale-105">
                        {at.type === "image" ? (
                            <img src={at.url} alt="upload" className="w-full h-full object-cover" />
                        ) : at.type === "video" ? (
                            <div className="w-full h-full flex items-center justify-center bg-indigo-500/10">
                                <Film className="h-6 w-6 text-indigo-500" />
                            </div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/10">
                                <Mic className="h-6 w-6 text-primary" />
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={(e) => removeAttachment(e, i)}
                            className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 className="h-4 w-4 text-white" />
                        </button>
                    </div>
                ))}

                {mode === "idle" && (
                    <div className="flex gap-2">
                        {/* Custom File Input Trigger */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*,video/*"
                            onChange={handleFileSelect}
                            disabled={isUploading}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            className="w-16 h-16 rounded-xl border border-dashed border-white/20 bg-card/20 hover:bg-card/40 hover:border-primary/50 text-muted-foreground hover:text-primary transition-all cursor-pointer group p-0 flex items-center justify-center"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); fileInputRef.current?.click(); }}
                            disabled={isUploading}
                        >
                            <ImageIcon className="h-5 w-5" />
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-16 h-16 rounded-xl border-dashed border-white/20 bg-card/20 hover:border-primary/50 text-muted-foreground hover:text-primary p-0 flex flex-col items-center justify-center gap-1"
                            onClick={startCamera}
                            disabled={isUploading}
                        >
                            <Camera className="h-5 w-5" />
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-16 h-16 rounded-xl border-dashed border-white/20 bg-card/20 hover:border-primary/50 text-muted-foreground hover:text-primary p-0 flex flex-col items-center justify-center gap-1"
                            onClick={startRecording}
                            disabled={isUploading}
                        >
                            <Mic className="h-5 w-5" />
                        </Button>
                    </div>
                )}
            </div>

            {/* --- Modals for Camera / Audio --- */}
            {mode === "camera" && (
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border border-white/10 group min-h-[240px]">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute inset-x-0 bottom-4 flex justify-center gap-4">
                        <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="rounded-full bg-white/10 border-white/20 backdrop-blur-md"
                            onClick={stopCamera}
                        >
                            <X className="h-4 w-4 text-white" />
                        </Button>
                        <Button
                            type="button"
                            size="lg"
                            className="w-14 h-14 rounded-full bg-primary shadow-lg border-4 border-white/20 group-active:scale-95 transition-transform"
                            onClick={capturePhoto}
                        >
                            <Camera className="h-6 w-6 text-white" />
                        </Button>
                    </div>
                </div>
            )}

            {mode === "audio" && (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/10 border border-primary/20 animate-pulse">
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                        <span className="text-sm font-bold text-primary">Recording Voice Memo...</span>
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="rounded-full flex items-center gap-2"
                        onClick={stopRecording}
                    >
                        <StopCircle className="h-4 w-4" /> Stop
                    </Button>
                </div>
            )}

            {isUploading && (
                <p className="text-[10px] text-primary animate-pulse font-bold tracking-tighter">Syncing to cloud storage...</p>
            )}
        </div>
    );
}

function Label({ children, className }: { children: React.ReactNode, className?: string }) {
    return <label className={`block ${className}`}>{children}</label>;
}
