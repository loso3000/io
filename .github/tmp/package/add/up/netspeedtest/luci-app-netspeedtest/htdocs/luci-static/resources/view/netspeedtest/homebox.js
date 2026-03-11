/*   Copyright (C) 2021-2026 sirpdboy herboy2008@gmail.com */
'use strict';
'require view';
'require fs';
'require ui';
'require uci';
'require form';
'require poll';

var state = { 
    running: false,
    port: 3300,
    enabled: false,
    operationInProgress: false,
    operationType: null  // 'start' 或 'stop'
};

const logPath = '/tmp/netspeedtest.log';

async function checkProcess() {
    try {
        const res = await fs.exec('/usr/bin/pgrep', ['homebox']);
        if (res.code === 0 && res.stdout.trim()) {
            return { running: true, pid: res.stdout.trim() };
        }
        
        const psRes = await fs.exec('/bin/ps', ['-w', '-C', 'homebox', '-o', 'pid=']);
        const pid = psRes.stdout.trim();
        return {
            running: !!pid,
            pid: pid || null
        };
    } catch (err) {
        return { running: false, pid: null };
    }
}


function controlService(action, port) {
    if (action === 'start') {
        return fs.exec('/usr/bin/killall', ['homebox'])
            .catch(function() { return Promise.resolve(); })
            .then(function() {
                var command = 'nohup /usr/bin/homebox serve --port ' + port + ' > ' + logPath + ' 2>&1 &';
                return fs.exec('/bin/sh', ['-c', command]);
            });
    } else {
       return  fs.exec('/usr/bin/killall', ['homebox']);

    }
}

function saveConfiguration(newPort, enabled) {
    const uciContent = `config netspeedtest 'config'
\toption homebox_port '${newPort}'
\toption homebox_enabled '${enabled ? '1' : '0'}'
`;
    
    return fs.write('/etc/config/netspeedtest', uciContent)
        .then(() => {
            if (enabled) {
                return fs.exec('/etc/init.d/netspeedtest', ['enable']);
            } else {
                return fs.exec('/etc/init.d/netspeedtest', ['disable']);
            }
        })
        .then(() => {
            return uci.load('netspeedtest');
        });
}

return view.extend({
    handleSaveApply: null,
    handleSave: null,
    handleReset: null,
    
    load: function() {
        return Promise.all([
            uci.load('netspeedtest')
        ]).then(() => {
            var port = uci.get('netspeedtest', 'config', 'homebox_port');
            if (port) {
                state.port = parseInt(port);
            }
            
            var enabled = uci.get('netspeedtest', 'config', 'homebox_enabled');
            state.enabled = enabled === '1';
        });
    },
    
    render: function() {
        var container = E('div');
        var statusSection = E('div', { 'class': 'cbi-section' });
        var statusIcon = E('span', { 'style': 'margin-right: 5px;' });
        var statusText = E('span');
        var toggleBtn = E('button', { 'class': 'btn cbi-button' });
        
        var saveBtn = E('button', { 
            'class': 'btn cbi-button cbi-button-apply',
            'style': 'margin-left: 10px;'
        }, _('Save'));
        
        var enableCheckbox = E('input', {
            'type': 'checkbox',
            'id': 'homebox_enable',
            'class': 'cbi-input-checkbox'
        });
        
        var statusMessage = E('div', { style: 'text-align: center; padding: 2em;' }, [
            E('img', {
                src: 'data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjEwMjQiIGhlaWdodD0iMTAyNCIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCI+PHBhdGggZmlsbD0iI2RmMDAwMCIgZD0iTTk0Mi40MjEgMjM0LjYyNGw4MC44MTEtODAuODExLTE1My4wNDUtMTUzLjA0NS04MC44MTEgODAuODExYy03OS45NTctNTEuNjI3LTE3NS4xNDctODEuNTc5LTI3Ny4zNzYtODEuNTc5LTI4Mi43NTIgMC01MTIgMjI5LjI0OC01MTIgNTEyIDAgMTAyLjIyOSAyOS45NTIgMTk3LjQxOSA4MS41NzkgMjc3LjM3NmwtODAuODExIDgwLjgxMSAxNTMuMDQ1IDE1My4wNDUgODAuODExLTgwLjgxMWM3OS45NTcgNTEuNjI3IDE3NS4xNDcgODEuNTc5IDI3Ny4zNzYgODEuNTc5IDI4Mi43NTIgMCA1MTItMjI5LjI0OCA1MTItNTEyIDAtMTAyLjIyOS0yOS45NTItMTk3LjQxOS04MS41NzktMjc3LjM3NnpNMTk0Ljk0NCA1MTJjMC0xNzUuMTA0IDE0MS45NTItMzE3LjA1NiAzMTcuMDU2LTMxNy4wNTYgNDggMCA5My40ODMgMTAuNjY3IDEzNC4yMjkgMjkuNzgxbC00MjEuNTQ3IDQyMS41NDdjLTE5LjA3Mi00MC43ODktMjkuNzM5LTg2LjI3Mi0yOS43MzktMTM0LjI3MnpNNTEyIDgyOS4wNTZjLTQ4IDAtOTMuNDgzLTEwLjY2Ny0xMzQuMjI5LTI5Ljc4MWw0MjEuNTQ3LTQyMS41NDdjMTkuMDcyIDQwLjc4OSAyOS43ODEgODYuMjcyIDI5Ljc4MSAxMzQuMjI5LTAuMDQzIDE3NS4xNDctMTQxLjk5NSAzMTcuMDk5LTMxNy4wOTkgMzE3LjA5OXoiLz48L3N2Zz4=',
                style: 'width: 100px; height: 100px; margin-bottom: 1em;'
            }),
            E('h2', {}, _('Homebox Service Not Running'))
        ]);
        
        var isHttps = window.location.protocol === 'https:';
        var iframe;
        
        var portInput = E('input', {
            'type': 'number',
            'class': 'cbi-input-text',
            'style': 'width: 100px;',
            'value': state.port,
            'min': 1024,
            'max': 65535,
            'placeholder': '3300'
        });
        
        var portError = E('span', {
            'class': 'error',
            'style': 'color: red; margin-left: 10px; display: none;'
        }, _('Port range must be 1024-65535'));

        function createHttpsButton() {
            return E('div', {
                style: 'text-align: center; padding: 2em;'
            }, [
                E('h2', {}, _('Homebox Control panel')),
                E('p', {}, _('Due to browser security policies, the Homebox interface https cannot be embedded directly.')),
                E('a', {
                    href: 'http://' + window.location.hostname + ':' + state.port,
                    target: '_blank',
                    class: 'cbi-button cbi-button-apply',
                    style: 'display: inline-block; margin-top: 1em; padding: 10px 20px; font-size: 16px; text-decoration: none; color: white;'
                }, _('Open Web Interface'))
            ]);
        }

        function updateStatus() {
            statusIcon.textContent = state.running ? '✓' : '✗';
            statusIcon.style.color = state.running ? 'green' : 'red';
            statusText.textContent = _('Homebox Server') + ' ' + (state.running ? _('RUNNING') : _('NOT RUNNING'));
            statusText.style.color = state.running ? 'green' : 'red';
            statusText.style.fontWeight = 'bold'; 
            statusText.style.fontSize = '0.92rem'; 
            
            if (state.operationInProgress) {
                if (state.operationType === 'start') {
                    toggleBtn.textContent = _('Starting...');
                } else if (state.operationType === 'stop') {
                    toggleBtn.textContent = _('Stopping...');
                }
                toggleBtn.className = 'btn cbi-button cbi-button-apply';
                toggleBtn.disabled = true;
            } else {
                toggleBtn.textContent = state.running ? _('Stop Server') : _('Start Server');
                toggleBtn.className = 'btn cbi-button cbi-button-' + (state.running ? 'reset' : 'apply');
                toggleBtn.disabled = false;
            }
            
            enableCheckbox.checked = state.enabled;
            portInput.value = state.port;
            
            container.innerHTML = '';
            if (state.running) {
                toggleBtn.textContent = state.running ? _('Stop Server') : _('Start Server');
                toggleBtn.className = 'btn cbi-button cbi-button-' + (state.running ? 'reset' : 'apply');
                toggleBtn.disabled = false;
                if (isHttps) {
                    container.appendChild(createHttpsButton());
                } else {
                    iframe = E('iframe', {
                        src: 'http://' + window.location.hostname + ':' + state.port,
                        style: 'border:none;width: 100%; min-height: 80vh; border: none; border-radius: 3px;overflow:hidden !important;'
                    });
                    container.appendChild(iframe);
                }
            } else {
                container.appendChild(statusMessage);
            }
        }

        toggleBtn.addEventListener('click', function(ev) {
            ev.preventDefault();
            
            if (toggleBtn.disabled || state.operationInProgress) return;
            
            var action = state.running ? 'stop' : 'start';

            state.operationInProgress = true;
            state.operationType = action;
            updateStatus(); 
            
            controlService(action, state.port)
                .then(function() {
                    return checkProcess(); 
                })
                .then(function(res) {
                    if (res && res.cancelled) {
                        return;
                    }
                    
                    if (res) {
                        state.running = res.running || false;
                        if (res.port) {
                            state.port = res.port;
                        }
                    }
                    
                    state.operationInProgress = false;
                    state.operationType = null;
                    updateStatus();
                    
                    var message = action === 'start' ? 
                        _('Homebox server started on port %s').replace('%s', state.port) : 
                        _('Homebox server stopped');
                })
                .catch(function(err) {
                    if (err && err.message && err.message.indexOf('aborted') > -1) {
                        return checkProcess().then(function(res) {
                            state.running = res.running;
                            if (res.port) state.port = res.port;
                            state.operationInProgress = false;
                            state.operationType = null;
                            updateStatus();
                        });
                    }
                    
                    state.operationInProgress = false;
                    state.operationType = null;
                    updateStatus();
                });
        });

        saveBtn.addEventListener('click', function(ev) {
            ev.preventDefault();
            
            var newPort = parseInt(portInput.value, 10);
            if (isNaN(newPort) || newPort < 1024 || newPort > 65535) {
                portError.style.display = 'inline';
                return;
            }
            portError.style.display = 'none';
            
            saveBtn.disabled = true;
            saveBtn.textContent = _('Saving...');
            
            saveConfiguration(newPort, enableCheckbox.checked)
                .then(function() {
                    updateStatus();
                    
                })
                .catch(function(err) {
                })
                .finally(function() {
                    saveBtn.disabled = false;
                    saveBtn.textContent = _('Save');
                });
        });

        enableCheckbox.addEventListener('change', function(ev) {
            saveConfiguration(state.port, enableCheckbox.checked)
                .then(function() {
                    state.enabled = enableCheckbox.checked;
                    updateStatus();
                    
                    var message = enableCheckbox.checked ? 
                        _('Auto start enabled') : 
                        _('Auto start disabled');
                })
                .catch(function(err) {
                    enableCheckbox.checked = state.enabled;
                });
        });

        statusSection.appendChild(E('div', { 'style': 'margin: 15px' }, [
            E('h3', {}, _('Throughput speedtest Homebox')),
            E('div', { 'class': 'cbi-map-descr' }, [statusIcon, statusText]),
            
            E('div', {'class': 'cbi-value'}, [
                E('div', {'class': 'cbi-value-title'}, _('Auto Start')),
                E('div', {'class': 'cbi-value-field'}, [
                    enableCheckbox,
                    E('label', {'for': 'homebox_enable', 'style': 'margin-left: 5px;'})
                ])
            ]),
            
            E('div', {'class': 'cbi-value' }, [
                E('div', {'class': 'cbi-value-title'}, _('Port Setting')),
                E('div', {'class': 'cbi-value-field', 'style': 'align-items: center;'}, [
                    portInput,
                    saveBtn,
                    portError
                ])
            ]),
            
            E('div', {'class': 'cbi-value'}, [
                E('div', {'class': 'cbi-value-title'}, _('Service Control')),
                E('div', {'class': 'cbi-value-field'}, toggleBtn)
            ])
        ]));

        checkProcess().then(function(res) {
            state.running = res.running;
            if (res.port) {
                state.port = res.port;
            }
            updateStatus();
            
            poll.add(function() {
                return checkProcess().then(function(res) {
                    if (res.running !== state.running || (res.port && res.port !== state.port)) {
                        state.running = res.running;
                        if (res.port) {
                            state.port = res.port;
                        }
                        updateStatus();
                    }
                });
            }, 5);
        });

        return E('div', {}, [
            statusSection,
            container
        ]);
    }
});