export const shuffleArray = (array: any[]) => {
    const oldArray = [...array];
    const newArray = [];

    while (oldArray.length) {
        const index = Math.floor(Math.random() * oldArray.length);
        newArray.push(oldArray.splice(index, 1)[0]);
    }

    return newArray;
};
