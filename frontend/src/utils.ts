
export function generateUUID() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function getMetaContent(name: string) {
    const metaHTML = document.querySelector(`meta[name="${name}"]`)
    if (metaHTML != null) {
        return metaHTML.getAttribute("content")
    }
}

export function getAccessToken(): string | null {
    const localStorageAccessToken = localStorage.getItem("token")
    const sessionStorageAccessToken = sessionStorage.getItem("token")

    if (localStorageAccessToken != null) {
        return localStorageAccessToken
    } else if (sessionStorageAccessToken != null) {
        return sessionStorageAccessToken
    } else {
        return null
    }
}

export function getTeamId(): number | null {
    const localStorageTeamId = localStorage.getItem("team_id")
    const sessionStorageTeamId = sessionStorage.getItem("team_id")

    if (localStorageTeamId != null) {
        return parseInt(localStorageTeamId)
    } else if (sessionStorageTeamId != null) {
        return parseInt(sessionStorageTeamId)
    } else {
        return null
    }
}