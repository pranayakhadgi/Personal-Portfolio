class CustomWindow extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.setupDraggable();
        this.setupControls();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                .window {
                    position: absolute;
                    width: 600px;
                    min-height: 400px;
                    background: rgba(23, 21, 45, 0.9);
                    border: 2px solid #dfffc7;
                    border-radius: 8px;
                    box-shadow: 0 0 20px rgba(83, 43, 220, 0.5);
                    overflow: hidden;
                    pointer-events: auto;
                }

                .window-header {
                    background: #532bdc;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 8px;
                    color: #dfffc7;
                    font-weight: bold;
                    cursor: move;
                }

                .window-controls {
                    display: flex;
                    gap: 8px;
                }

                .window-control {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    cursor: pointer;
                }

                .window-content {
                    padding: 16px;
                    height: calc(100% - 32px);
                    overflow-y: auto;
                    color: #dfffc7;
                }

                .minimized {
                    height: 32px !important;
                    overflow: hidden;
                }

                .maximized {
                    width: calc(100% - 40px) !important;
                    height: calc(100% - 80px) !important;
                    top: 20px !important;
                    left: 20px !important;
                }
            </style>
            <div class="window">
                <div class="window-header">
                    <slot name="title">Window</slot>
                    <div class="window-controls">
                        <div class="window-control bg-red-500"></div>
                        <div class="window-control bg-yellow-500"></div>
                        <div class="window-control bg-green-500"></div>
                    </div>
                </div>
                <div class="window-content">
                    <slot name="content"></slot>
                </div>
            </div>
        `;
    }

    setupDraggable() {
        const header = this.shadowRoot.querySelector('.window-header');
        const windowElement = this.shadowRoot.querySelector('.window');
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        header.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            windowElement.style.top = (windowElement.offsetTop - pos2) + "px";
            windowElement.style.left = (windowElement.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    setupControls() {
        const controls = this.shadowRoot.querySelectorAll('.window-control');
        const windowElement = this.shadowRoot.querySelector('.window');

        controls[0].addEventListener('click', () => this.remove());
        controls[1].addEventListener('click', () => windowElement.classList.toggle('minimized'));
        controls[2].addEventListener('click', () => windowElement.classList.toggle('maximized'));
    }
}

customElements.define('custom-window', CustomWindow);