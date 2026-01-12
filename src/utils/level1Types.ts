
export interface Level1Data {
    map: number[][]; // 0=Floor, 1=Wall
    pillarPositions: [number, number][];
    cratePositions: [number, number][];
    sectorMap: number[][]; // 0=None, 1=Aquila, 2=Gild, 3=Corridor
}
