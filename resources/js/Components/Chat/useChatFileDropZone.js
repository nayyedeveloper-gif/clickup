import { useCallback, useRef, useState } from 'react';

function hasFilePayload(dataTransfer) {
    if (!dataTransfer?.types) return false;
    return [...dataTransfer.types].includes('Files');
}

/**
 * Drag-and-drop files onto a chat column (messages + composer).
 * Uses a counter so dragenter/dragleave across child nodes does not flicker the overlay.
 */
export function useChatFileDropZone(onFiles) {
    const depthRef = useRef(0);
    const [active, setActive] = useState(false);

    const onDragEnter = useCallback(
        (e) => {
            if (!hasFilePayload(e.dataTransfer)) return;
            e.preventDefault();
            e.stopPropagation();
            depthRef.current += 1;
            if (depthRef.current === 1) setActive(true);
        },
        []
    );

    const onDragLeave = useCallback((e) => {
        if (!hasFilePayload(e.dataTransfer)) return;
        e.preventDefault();
        e.stopPropagation();
        depthRef.current -= 1;
        if (depthRef.current <= 0) {
            depthRef.current = 0;
            setActive(false);
        }
    }, []);

    const onDragOverCapture = useCallback((e) => {
        if (!hasFilePayload(e.dataTransfer)) return;
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
    }, []);

    const onDropCapture = useCallback(
        (e) => {
            if (!hasFilePayload(e.dataTransfer)) return;
            e.preventDefault();
            e.stopPropagation();
            depthRef.current = 0;
            setActive(false);
            const files = e.dataTransfer?.files;
            if (files?.length) onFiles(files);
        },
        [onFiles]
    );

    return { active, onDragEnter, onDragLeave, onDragOverCapture, onDropCapture };
}
