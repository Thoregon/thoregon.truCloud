/**
 * interface for apps to the agent
 * mind: each app instance has its own agents
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

export default class AgentTerminal {

    constructor(agent, id) {
        this.agent = agent;
        this.id    = id;
    }

    isReady() {
        return this.agent?.ready ?? false;
    }

    sendEvent(channelname, type, detail) {
        const channel = this.agent.getChannel(channelname);
        if (!channel) return console.log(">> sendEvent(): channel does not exist", channelname);
        channel.sendEvent(type, detail);
    }
}
