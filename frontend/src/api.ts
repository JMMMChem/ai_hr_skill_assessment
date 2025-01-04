import { User } from "./interfaces"
import { getAccessToken } from "./utils"

export class RequestError extends Error {

    response: Response

    constructor(response: Response) {
        super()
        this.response = response
    }
}

export class AuthenticationError extends Error {}

export function toJsonOrRaise(response: Response) {
    if (!response.ok) {
        throw new RequestError(response)
    }
    return response.json()
}

export function raiseForStatus(response: Response) {
    if (!response.ok) {
        throw new RequestError(response)
    }
    return response
}


class Api {

    static async login(email: string, password: string) {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });
        const loginData = await toJsonOrRaise(response);
        
        // Store the access token
        localStorage.setItem('token', loginData.access_token);

        // Get user data to get the team ID
        const userResponse = await this.getCurrentUser();
        if (userResponse && userResponse.teams && userResponse.teams.length > 0) {
            const teamId = userResponse.teams[0].id.toString();
            localStorage.setItem('team_id', teamId);
        }
        
        return loginData;
    }

    static async getCurrentUser(): Promise<User | null> {
        const accessToken = getAccessToken()
        if (accessToken == null) {
            return null
        }

        const response = await fetch(import.meta.env.VITE_API_URL + "/api/auth/me", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        })

        return toJsonOrRaise(response)
    }

    static async sendTextToChatBot(text: string, conversationId: number) {
        const accessToken = getAccessToken()
        if (accessToken == null) {
            return null
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/rag/qna`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                question: text,
                conversation_id: conversationId
         })}
    );

        return toJsonOrRaise(response);
    }

    static async sendTextToTrainerChatBot(text: string, conversationId: number) {
        const accessToken = getAccessToken()
        if (accessToken == null) {
            return null
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/rag/agent_trainer_qna`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                question: text,
                conversation_id: conversationId
         })}
    );

        return toJsonOrRaise(response);
    }


    static async getTrainerCharacters() {
        const accessToken = getAccessToken()
        if (accessToken == null) {
            return null
        }
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/trainer_characters/`, 
            { headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            
            } }
        );
        return toJsonOrRaise(response);
    }

    static async trainModel(assistantId: string) {
        const accessToken = getAccessToken()
        if (accessToken == null) {
            return null
        }
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/rag/add_uploaded_file_to_chromadb/`, 
            {   
                method: "POST",
                headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                id: assistantId
         })}
        );
        if (!response.ok) {
            throw new Error('Model training failed');
          }
          
        return toJsonOrRaise(response);
    }

    static async getConversations() {
        try {
            const accessToken = getAccessToken()
            if (accessToken == null) {
                console.error("No access token found");
                return [];
            }
            const teamId = localStorage.getItem('team_id');
            if (!teamId) {
                console.error("No team ID found");
                return [];
            }
            console.log("Fetching conversations for team:", teamId);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/conversations/?team_id=${teamId}`, 
                { headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                } }
            );
            const data = await toJsonOrRaise(response);
            console.log("Fetched conversations:", data);
            return data;
        } catch (error) {
            console.error("Error fetching conversations:", error);
            return [];
        }
    }

    static async getTrainerConversations() {
        const accessToken = getAccessToken()
        if (accessToken == null) {
            return null
        }
        const teamId = localStorage.getItem('team_id');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/conversations_training/?team_id=${teamId}`, 
            { headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            
            } }
        );
        return toJsonOrRaise(response);
    }

    static async createConversation(title: string, team_id: string, assistantId: string) {
        const accessToken = getAccessToken()
        if (accessToken == null) {
            return null
        }
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/conversations/`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                title: title,
                team_id: team_id,
                assistant_id: assistantId
            })
        });
        return toJsonOrRaise(response);
    }

    static async deleteConversation(chatId: string) {
        const accessToken = getAccessToken()
        if (accessToken == null) {
            return null
        }
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/conversations/${chatId}`, {
            method: "DELETE",
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
        });
        return raiseForStatus(response);
    }

    static async updateConversationTitle(chatId: string, newTitle: string) {
        const accessToken = getAccessToken()
        if (accessToken == null) {
            return null
        }
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/conversations/${chatId}`, {
            method: "PUT",
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                title: newTitle
            })
        });
        return raiseForStatus(response);
    }

    static async updateConversationTitleTraining(chatId: string, newTitle: string) {
        const accessToken = getAccessToken()
        if (accessToken == null) {
            return null
        }
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/conversations_training/${chatId}`, {
            method: "PUT",
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                title: newTitle
            })
        });
        return raiseForStatus(response);
    }

    static async deleteConversationTraining(chatId: string) {
        const accessToken = getAccessToken()
        if (accessToken == null) {
            return null
        }
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/conversations_training/${chatId}`, {
            method: "DELETE",
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
        });
        return raiseForStatus(response);
    }

    static async createTrainerConversation(title: string, team_id: string, characterId: string) {
        const accessToken = getAccessToken()
        if (accessToken == null) {
            return null
        }
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/conversations_training/`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                title: title,
                team_id: team_id,
                character_id: characterId
            })
        });
        return toJsonOrRaise(response);
    }

    static async getMessagesByConversationId(conversationId: string) {
        const accessToken = getAccessToken()
        if (accessToken == null) {
            return null
        }
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/conversations/${conversationId}/messages`,
        { headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        
        } }
        );
        return toJsonOrRaise(response);
    }

    static async getTrainingMessagesByConversationId(conversationId: string) {
        const accessToken = getAccessToken()
        if (accessToken == null) {
            return null
        }
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/conversations_training/${conversationId}/messages`,
        { headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        
        } }
        );
        return toJsonOrRaise(response);
    }


    static async register(name: string, email: string, password: string, confirmPassword: string) {
        // First, register the user
        const registerResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                email: email,
                password: password,
                confirm_password: confirmPassword
            })
        });
        const userData = await toJsonOrRaise(registerResponse);

        // Then login to get the access token
        const loginResponse = await this.login(email, password);
        
        // Store the access token
        localStorage.setItem('token', loginResponse.access_token);

        // Store the team_id in localStorage
        if (userData.teams && userData.teams.length > 0) {
            const teamId = userData.teams[0].id.toString();
            localStorage.setItem('team_id', teamId);
            
            // Force reload to update team context
            window.location.reload();
        }
        
        return userData;
    }

    static async getTeams() {
        const accessToken = getAccessToken()
        if (accessToken == null) {
            return null
        }
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/teams/`, 
            { headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            } }
        );
        return toJsonOrRaise(response);
    }

    static async createTeam(name: string, description: string) {
        const accessToken = getAccessToken()
        if (accessToken == null) {
            return null
        }
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/teams/`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                name: name,
                description: description
            })
        });
        return toJsonOrRaise(response);
    }
}


export default Api