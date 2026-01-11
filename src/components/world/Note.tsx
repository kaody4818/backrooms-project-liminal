


export interface NoteProps {
    position: [number, number, number];
    title?: string;
    body?: string[];
}

export const Note = ({ position, title, body }: NoteProps) => {
    return (
        <group position={position}>
            {/* Paper Mesh */}
            <mesh
                castShadow
                receiveShadow
                rotation={[-Math.PI / 2, 0, Math.random() * 0.5]} // Slight random rotation
                userData={{
                    interactive: true,
                    type: 'note',
                    label: 'Read Note',
                    noteData: title && body ? { title, body } : undefined
                }}
            >
                <planeGeometry args={[0.3, 0.4]} />
                <meshStandardMaterial color="#fdfef0" />
            </mesh>
        </group>
    );
};
