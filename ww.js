class CSSWAF {
    constructor(options = {}) {
        this.cookieName = options.cookieName || 'csswaf_session';
        this.sequences = new Map();
        this.expected = new Map();
        this.validated = new Map();
        this.honeypotImg = ['G.html', 'H.txt', 'I.sitemap', 'J.xml', 'article', 'content', 'user', 'history', 'O', 'P', 'Q'];
        this.sequence = ['A', 'B', 'C', 'D', 'E', 'F'];
        this.cssAnimationTS = 3.5;
        this.showSessionStatusTS = 4.0;
        this.pageRefreshTS = 5.5;
    }

    generateSessionID() {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return btoa(String.fromCharCode.apply(null, array))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }

    shuffle(array) {
        let currentIndex = array.length;
        let temporaryValue, randomIndex;

        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;
    }

    setCookie(name, value, hours) {
        let expires = '';
        if (hours) {
            const date = new Date();
            date.setTime(date.getTime() + (hours * 60 * 60 * 1000));
            expires = '; expires=' + date.toUTCString();
        }
        document.cookie = name + '=' + value + expires + '; path=/';
    }

    getCookie(name) {
        const nameEQ = name + '=';
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    addImageLoad(sessionID, imageID) {
        let sequence = this.sequences.get(sessionID) || [];
        
        if (this.honeypotImg.includes(imageID)) {
            console.warn('Honeypot image loaded', { sessionID, imageID });
            sequence = ['Honeypot_placeholder'];
            this.sequences.set(sessionID, sequence);
            return;
        }

        sequence.push(imageID);
        console.info('Image loaded', { sessionID, imageID, sequence });
        this.sequences.set(sessionID, sequence);

        const expectedSeq = this.expected.get(sessionID);
        if (expectedSeq && sequence.length === expectedSeq.length) {
            const match = sequence.every((val, index) => val === expectedSeq[index]);
            this.validated.set(sessionID, match);
            console.info('Session validation result', {
                sessionID,
                validated: match,
                expected: expectedSeq,
                received: sequence
            });
        }
    }

    setExpectedSequence(sessionID, sequence) {
        this.expected.set(sessionID, sequence);
        this.sequences.set(sessionID, []);
        console.info('Set expected sequence for session', { sessionID, sequence });
    }

    isValidated(sessionID) {
        return this.validated.get(sessionID) || false;
    }

    init() {
        let sessionID = this.getCookie(this.cookieName);
        if (!sessionID) {
            sessionID = this.generateSessionID();
            this.setCookie(this.cookieName, sessionID, 1); // 1 hour
        }

        const expectedSequence = this.shuffle([...this.sequence]);
        this.setExpectedSequence(sessionID, expectedSequence);

        // Create and inject CSS
        const style = document.createElement('style');
        style.textContent = this.generateCSS(sessionID, expectedSequence);
        document.head.appendChild(style);

        // Create challenge container
        const container = document.createElement('div');
        container.innerHTML = this.generateHTML(sessionID);
        document.body.appendChild(container);

        // Set refresh timeout
        setTimeout(() => {
            if (!this.isValidated(sessionID)) {
                window.location.reload();
            }
        }, this.pageRefreshTS * 1000);
    }

    generateCSS(sessionID, expectedSequence) {
        return `
            .honeypot {
                ${this.shuffle(this.honeypotImg).slice(0, 1).map(img => 
                    `content: url('/_csswaf/img/${img}?sid=${sessionID}&from=css_content_url');`
                ).join('\n')}
            }
            @keyframes csswaf-load {
                ${expectedSequence.map((img, i) => {
                    const f = i / expectedSequence.length;
                    return `${Math.floor(f * 100)}% { content: url('/_csswaf/img/${img}?sid=${sessionID}'); }`;
                }).join('\n')}
            }
            /* center the content */
body {
display: flex;
justify-content: center;
align-items: center;
height: 100vh;
margin: 0;
font-family: Arial, sans-serif;
background-color: #f9f5d7;
}

.container {
text-align: center;
}

/* copied from anubis */
.lds-roller,
.lds-roller div,
.lds-roller div:after {
	box-sizing: border-box;
}

.lds-roller {
	display: inline-block;
	position: relative;
	width: 80px;
	height: 80px;
}

.lds-roller div {
	animation: lds-roller 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
	transform-origin: 40px 40px;
}

.lds-roller div:after {
	content: " ";
	display: block;
	position: absolute;
	width: 7.2px;
	height: 7.2px;
	border-radius: 50%;
	background: currentColor;
	margin: -3.6px 0 0 -3.6px;
}

.lds-roller div:nth-child(1) {
	animation-delay: -0.036s;
}

.lds-roller div:nth-child(1):after {
	top: 62.62742px;
	left: 62.62742px;
}

.lds-roller div:nth-child(2) {
	animation-delay: -0.072s;
}

.lds-roller div:nth-child(2):after {
	top: 67.71281px;
	left: 56px;
}

.lds-roller div:nth-child(3) {
	animation-delay: -0.108s;
}

.lds-roller div:nth-child(3):after {
	top: 70.90963px;
	left: 48.28221px;
}

.lds-roller div:nth-child(4) {
	animation-delay: -0.144s;
}

.lds-roller div:nth-child(4):after {
	top: 72px;
	left: 40px;
}

.lds-roller div:nth-child(5) {
	animation-delay: -0.18s;
}

.lds-roller div:nth-child(5):after {
	top: 70.90963px;
	left: 31.71779px;
}

.lds-roller div:nth-child(6) {
	animation-delay: -0.216s;
}

.lds-roller div:nth-child(6):after {
	top: 67.71281px;
	left: 24px;
}

.lds-roller div:nth-child(7) {
	animation-delay: -0.252s;
}

.lds-roller div:nth-child(7):after {
	top: 62.62742px;
	left: 17.37258px;
}

.lds-roller div:nth-child(8) {
	animation-delay: -0.288s;
}

.lds-roller div:nth-child(8):after {
	top: 56px;
	left: 12.28719px;
}

@keyframes lds-roller {
	0% {
	transform: rotate(0deg);
	}

	100% {
	transform: rotate(360deg);
	}
}

.message {
	font-size: 18px;
	color: #333;
	margin-top: 10px;
}

/* Image switching animation */
.pensive {
	animation: show-pensive 4s steps(1, end) forwards;
}

.mysession {
	animation: show-mysession 4s steps(1, end) forwards;
	opacity: 0; /* hide initially */
}

@keyframes show-pensive {
	0% {
		opacity: 1;
		content: url('/_csswaf/res/pensive.webp');
	}
	100% {
		opacity: 0;
	}
}

@keyframes show-mysession {
	0% {
		opacity: 0;
	}
	100% {
		opacity: 1;
		content: url('/_csswaf/res/sessionstatus.webp');
	}
}

.honeya {
	display: none;
	width: 0px;
	height: 0px;
	position: absolute;
	top: -9898px;
	left: -9898px;
}
        `;
    }

    generateHTML(sessionID) {
        return `
            <div class="csswaf-hidden"></div>
            <div class="container">
                <div class="pensive"></div>
                <div class="mysession"></div>
                <p class="message">...</p>
                <div id="spinner" class="lds-roller">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
                <p class="message">Challenge: please wait for ${this.pageRefreshTS} seconds</p>
                <p class="message">This Challenge is NoJS friendly</p>
                <p class="message">Session ID: ${sessionID}</p>
                <footer>
                    <p>Powered by <a href="https://github.com/yzqzss/csswaf">CSSWAF</a></p>
                </footer>
            </div>
        `;
    }
}

// Initialize CSSWAF when the script loads
window.csswaf = new CSSWAF();
document.addEventListener('DOMContentLoaded', () => window.csswaf.init());
