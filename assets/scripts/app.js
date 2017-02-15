var actualPage;
var user = {};
var totalScore;
var totalTime;
var code;
var tipoProfissional;

if (!localStorage.contacts) {
    localStorage.contacts = JSON.stringify([]);
}
if (!localStorage.usedCodes) {
    localStorage.usedCodes = JSON.stringify([]);
}

var init = function () {
    user = {};
    totalTime = 0;
    totalScore = 0;

}

var syncronize = (function () {
    var connectedRef = firebase.database().ref(".info/connected");
    connectedRef.on("value", function (snap) {
        if (navigator.onLine && snap.val() === true) {
            var data = JSON.parse(localStorage["contacts"]);
            data.forEach(function (obj) {

                var newPostRef = firebase.database().ref('dados/' + obj.code).set(obj);

            });
            // add data to firebase
            //firebase.database().ref('dados/').set(JSON.parse(localStorage["contacts"]));

        } else if (!navigator.onLine) {
            console.log("Not connected. Não será sincronizado com o servidor.");
        }
    });
})();

// navigation function
var navigation = (function () {
    "use strict"

    // handler the click and call load
    var nav = function () {

        $(document).on('click', '.navTo', function () {

            var page = $(this).data('page');
            var _callback = $(this).data('callback');

            load(page, _callback);

        });

    };

    // call load function
    var load = function (page, callback) {

        $('#app').load(page, function () {

            actualPage = page;

            if (typeof callback === 'function') {
                callback();
            } else if (typeof callback === 'string') {

                var _function = window[callback];
                if (typeof _function === 'function') {
                    _function();

                }
            }

        })
        .hide()
        .fadeIn();
    };

    return {
        page: nav(),
        load: load
    }

})();

//navigation.load('home.html', home);
navigation.load('codigo.html', function () {
    codigo();
});

// homepage
function home() {
    console.log('this is home');
    $('.btn-admin').on('click', function () {
        navigation.load('admin-login.html', function () {
            console.log('admin-login');
            adminLogin();
        });
    });
};

var adminLogin = function () {

    $('.admin-btn-fechar').on('click', function () {
        reinitApp();
    });

    $('.admin-btn-password').on('click', function () {

        var pass = $('.admin-password').val();
        if (pass === 'ceva123') {
            navigation.load('admin-options.html', function () {

                $('.admin-btn-fechar').on('click', function () {
                    reinitApp();
                });

                $('.ranking').on('click', function () {
                    var ref = firebase.database().ref('contacts/').limitToLast(5).orderByChild('average');
                    var ranking = '';
                    var ranking2 = '';
                    ref.on("value", function (snapshot) {
                        //console.log(snapshot.val());
                        console.log(snapshot.val());
                        var results = snapshot.val();
                        snapshot.forEach(function (data) {
                            //console.log("The " + data.key + " rating is " + data.val().nif);
                            ranking += '<div class="top-ranking">Nome: ' + data.val().nome + ', Respostas: ' + data.val().respostas + ', Tempo: ' + data.val().time + '</div>'
                            ranking2 += '<div class="top-ranking">Nome: ' + data.val().nome + ', Respostas: ' + data.val().respostas + ', Tempo: ' + data.val().time + '</div>'
                        });
                        ranking = '<div class="ranking1">' + ranking + '</div>';
                        ranking2 = '<div class="ranking2">' + ranking2 + '</div>';

                        console.log(ranking);
                        $('.caixa').html('<div class="rankingScroll">' + ranking + ranking2 + '</div>');
                    }, function (error) {
                        console.log("Error: " + error.code);
                    });
                });

                $('.apagar').on('click', function () {
                    console.log('apagar');
                    var connectedRef = firebase.database().ref(".info/connected");
                    connectedRef.on("value", function (snap) {
                        var del = confirm('Deseja apagar todos os dados?');
                        if (del === true) {
                            firebase.database().ref().child('contacts').remove();
                            alert('Dados apagados com sucesso!');
                        }
                    });
                });

                $('.exportar').on('click', function () {

                    if (localStorage.contacts) {
                        JSONToCSVConvertor(localStorage.contacts, "contactos", true);
                    }

                    var connectedRef = firebase.database().ref(".info/connected");
                    connectedRef.on("value", function (snap) {
                        if (navigator.onLine && snap.val() === true) {
                            var ref = firebase.database().ref('contacts/').limitToLast(5).orderByChild('average');
                            var ranking = '';
                            ref.on("value", function (snapshot) {
                                var data = JSON.stringify(snapshot.val());
                                //console.log(data);
                                $.ajax({
                                    url: "http://fixhouse.pt/api/sendEmail.php",
                                    type: "POST",
                                    data: {
                                        //data : data
                                    },
                                    context: document.body
                                }).done(function (r) {
                                    console.log(r);
                                });
                            });

                            if (localStorage.contacts) {
                                //JSONToCSVConvertor(localStorage.contacts, "contactos", true);
                            }

                        } else if (!navigator.onLine) {
                            console.log("Not connected. Não será sincronizado com o servidor.");

                            if (localStorage.contacts) {
                                JSONToCSVConvertor(localStorage.contacts, "contactos", true);
                            }
                        }
                    });

                    alert('Dados exportados com sucesso e cruzados com sucesso!');
                });

            });
        }
    });
};

// pagina codigo
var codigo = function () {

    $('.btn-admin').on('click', function () {
        navigation.load('admin-login.html', function () {
            console.log('admin-login');
            adminLogin();
        });
    });

    // detecting inserting code
    $(document).on('change paste keyup', '#insiraCodigo', function () {
        console.log($(this).val().length);
        if ($(this).val().length === 6) {
            validateCode($(this).val());
        }
    });

    console.log('this is codigo page');

};

// validate code inserted
var validateCode = function (_codigo) {

    var codigos = codes;

    if (codigos.indexOf(_codigo.toUpperCase()) > -1 || _codigo.toUpperCase() == 'APCEVA') {
        console.log('código correcto');

        // validate in firebase
        var connectedRef = firebase.database().ref(".info/connected");
        connectedRef.on("value", function (snap) {
            if (navigator.onLine && snap.val() === true) {

                var returnedCode = null;
                firebase.database().ref('/contacts/' + _codigo.toUpperCase()).once('value').then(function (snapshot) {
                    console.log(snapshot.val());
                    returnedCode = snapshot.val();

                    // if return a value its is used
                    if (_codigo.toUpperCase() != 'APCEVA' && snapshot.val() !== null) {
                        alert('Este código já foi utilizado');
                        reinitApp();
                        return false;

                    } else {

                        var useds = JSON.parse(localStorage["usedCodes"]);
                        useds.push(_codigo.toUpperCase());

                        localStorage["usedCodes"] = JSON.stringify(useds);

                        // set global code
                        code = _codigo.toUpperCase();

                        navigation.load('tipoProfissional.html', tipoProfissional);
                    }
                });


            } else if (!navigator.onLine) { // offline
                console.log("Not connected. Não será sincronizado com o servidor.");

                // set global code
                code = _codigo;

                var useds = JSON.parse(localStorage["usedCodes"]);
                useds.push(_codigo);

                localStorage["usedCodes"] = JSON.stringify(useds);

                navigation.load('tipoProfissional.html', tipoProfissional);
            }
        });



    } else {
        alert('Código inválido');
        reinitApp();
        return false;
    }
}

var tipoProfissional = function () {
    hideKeyboard();
    console.log('tipoProfissional');
    $('#tipoProfissional input').on('click', function () {

        var tipo = $(this).val();

        if (tipo == '0') {
            // médico
            navigation.load('mensagem.html', function () {
                tipoProfissional = 'Médico';
                mensagemResponda(questionsMedicos);
            });
        } else {
            // enfermeiro
            navigation.load('mensagem.html', function () {
                tipoProfissional = 'Enfermeiro';
                mensagemResponda(questionsEnfermeiros);
            });
        }

    });
}

var mensagemResponda = function (questions) {

    $('.btnNext1').on('click', function () {
        navigation.load('quiz.html', function () {
            quiz(questions);
        })
    })
}

var formulario = function () {
    $('.btnSend').on('click', function () {
        if (validateForm()) {
            navigation.load('parabens.html', parabens);
            //navigation.load('convite.html', function () {
            //    convite();
            //});
        }

    });

    function validateForm() {
        var nome = $('input[name="nome"]').val();
        var camv = $('input[name="camv"]').val();
        var morada = $('input[name="morada"]').val();
        var email = $('input[name="email"]').val();
        var telefone = $('input[name="telefone"]').val();
        var nif = $('input[name="nif"]').val();

        var $errorDiv = $('#generalError');

        if (nome === '' || camv === '' || morada === '' || email === '' || telefone === '' || nif === '') {
            $errorDiv.show();

            return false;

        } else {
            $errorDiv.hide();
            if (!ValidateEmail(email)) {

                $errorDiv.text('* Email inválido.');
                $errorDiv.show();
                return false;
            }

            if (nif.length < 9) {
                $errorDiv.text('* NIF Inválido.');
                $errorDiv.show();
                return false;
            }

            //if(telefone.match(/\d/g).length===9){
            if (telefone.length < 9) {
                $errorDiv.text('* Número de telefone inválido.');
                $errorDiv.show();
                return false;
            }

            user.nome = nome;
            user.camv = camv;
            user.morada = morada;
            user.email = email;
            user.telefone = telefone;
            user.nif = nif;
            user.respostas = totalScore;
            user.time = totalTime;
            user.code = code;
            user.average = Math.floor(parseInt(totalScore) / parseInt(totalTime.replace('m', '').replace('s', '')) * 100);
            user.tipoProfissional = tipoProfissional;

            var dataUSer = user;
            var contacts = JSON.parse(localStorage["contacts"]);
            contacts.push(dataUSer);
            contacts.sort(function (a, b) {
                return parseFloat(a.respostas) - parseFloat(b.respostas);
            });
            localStorage["contacts"] = JSON.stringify(contacts);

            var connectedRef = firebase.database().ref(".info/connected");
            connectedRef.on("value", function (snap) {
                if (navigator.onLine && snap.val() === true) {

                    // add data to firebase
                    firebase.database().ref('contacts/' + user.code).set(user);

                } else if (!navigator.onLine) {
                    console.log("Not connected. Não será sincronizado com o servidor.");
                }
            });

        }
        hideKeyboard();
        return true;
    }

    function ValidateEmail(email) {
        var x = String(email);
        var atpos = x.indexOf("@");
        var dotpos = x.lastIndexOf(".");
        if (atpos < 1 || dotpos < atpos + 2 || dotpos + 2 >= x.length) {
            return false;
        }

        return true;
    }
}

var parabens = function () {
    $('#totalScore').text(totalScore);
    $('.crono').html('Crono ' + totalTime);

    $('.btnSend').on('click', function () {
        navigation.load('convite.html', convite);
        //navigation.load('formulario.html', formulario);
    });
}

var convite = function () {
    console.log('convite');
    $('.btnVoltar, .admin-btn-fechar').on('click', function () {
        console.log('voltar');
        reinitApp();
    });
}

function quiz(tipo) {
    //console.log('jogo', arguments);
    // init game
    quizGame(tipo);
    $('.timer').stopwatch({ format: '{M}m{s.}s' }).stopwatch('start');
    //setTimeout(add, 1000);
}

// Hide keyboard in Ipad
var hideKeyboard = function () {
    document.activeElement.blur();
};

var reinitApp = function () {
    console.log('reinitApp');
    document.location = 'index.html';
}

$('.reinitGame').on('click', function () {
    console.log('reinit');
    var r = confirm('Reiniciar Jogo?');
    if (r === true) {
        reinitApp();
    }
});

function JSONToCSVConvertor(JSONData, ReportTitle, ShowLabel) {
    var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;
    var CSV = '';

    CSV += ReportTitle + '\r\n\n';

    if (ShowLabel) {
        var row = "";
        for (var index in arrData[0]) {
            row += index + ',';
        }
        row = row.slice(0, -1);
        CSV += row + '\r\n';
    }

    for (var i = 0; i < arrData.length; i++) {
        var row = "";
        for (var index in arrData[i]) {
            row += '"' + arrData[i][index] + '",';
        }
        row.slice(0, row.length - 1);
        CSV += row + '\r\n';
    }

    if (CSV == '') {
        alert("Invalid data");
        return;
    }

    var fileName = ReportTitle;
    var uri = 'data:text/csv;charset=ISO-8859-1,' + escape(CSV);
    window.location.href = uri;
}
