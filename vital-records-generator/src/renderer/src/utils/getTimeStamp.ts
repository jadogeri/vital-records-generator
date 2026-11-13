const getTimestamp = () : string => {
    const date: Date = new Date();
    const formattedDate: string = date.toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
    }).replace(/ /g, '-');
    return formattedDate
}

export default getTimestamp