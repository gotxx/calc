;(function($){
	"use strict";

    function Calculator(){
        this.setup();
        this.initSliders();
        this.getCurrencyData();
        this.events();
    }

    Calculator.prototype = {
        setup: function(){
            this.state = {
                currency: "PLN"
            };
            this.$app = $('#calc');
            this.$total = $('#totalCost');
            this.$slidersWrappers = $('.js-slider');
            this.$sliders = $('[data-slider]');
            // this.$currencySwitch = $("#currencySwitch");
            this.$currencySwitch = $("#switchCurrency");
            this.$sliderOutput = $('[data-binding]');
            this.diff = $.Deferred();
            this.sliderArray = [];
        },
        initSliders: function() {
            var self = this, inPln = {};
            this.$sliders.each(function(){
                self.sliderArray.push(new Foundation.Slider($(this)));
                self.setupSliderData($(this));
            });

            if( self.isDefined(self.state.grossInvoice)){
                inPln = self.state.grossInvoice;
            }

            self.setState({ grossInvoiceInPln: inPln}, 'set initial PLN state');
        },
        setupSliderData: function($slider){
            var sliderState = {},
                $sliderInput = $slider.find('input[type="hidden"]'),
                sliderInputId = $slider.find('[aria-controls]').attr('aria-controls'),
                sliderValue = +$sliderInput.val(),
                labelSufix = sliderInputId === 'grossInvoice' ? ' brutto' : '';

            if(!$slider.hasClass('js-slider-switch')) {
                this.updateLabels({
                    $slider: $slider,
                    labelLeftTpl: '<strong>' + $slider.data('start') + '</strong> <span>' + $slider.data('label') + '</span>',
                    labelRightTpl: '<strong>' + $slider.data('end') + '</strong> <span>' + $slider.data('label') + '</span>',
                    sliderOutputTpl: $slider.data('label') + labelSufix
                });
            }

            sliderState[sliderInputId] = {
                currentValue: +sliderValue,
                minValue: +$sliderInput.attr('min'),
                maxValue: +$sliderInput.attr('max'),
                step: +$sliderInput.attr('step')
            };

            this.setState(sliderState,sliderInputId + ' slider setup' );
        },
        updateLabels: function(option){
            var $labelLeft = option.$slider.find('.js-label-left'),
                labelLeftTpl = option.labelLeftTpl,
                $labelRight = option.$slider.find('.js-label-right'),
                labelRightTpl = option.labelRightTpl,
                $slideOutput = option.$slider.parents('.js-slider').next().find('.js-label'),
                sliderOutputTpl = option.sliderOutputTpl;

            $labelLeft.html(labelLeftTpl);
            $labelRight.html(labelRightTpl);
            $slideOutput.html(sliderOutputTpl);
        },
        updateSlider: function(sliderIndex, newOptions){
            var currentOptions = this.sliderArray[sliderIndex].options;
            // console.log(currentOptions);
            this.sliderArray[sliderIndex].options = Object.assign({}, currentOptions, newOptions);
        },
        events: function(){
            var self = this;
            this.$slidersWrappers.on('click', '.js-btn', {self: this}, this.sliderBtnHandler);
            // this.$currencySwitch.on('change', {self: this}, this.currencySwitchHandler);
            // $('#calc').on('mousedown', '.js-switch-paddle', {self: this}, this.currencySwitchHandler);

            this.$sliders.on('changed.zf.slider', function(e){
                var $currencySliderHandle = $(this).find('[aria-controls="switchCurrency"]'),
                    $sliderHandle = $(this).find('[aria-controls]');

                if(!$currencySliderHandle.hasClass('is-dragging')){

                    var $slider = $(this), sliderState = {},
                        $sliderInput = $slider.find('input[type="hidden"]'),
                        sliderInputId = $slider.find('[aria-controls]').attr('aria-controls'),
                        sliderValue = $sliderInput.val(),
                        $sliderOutput = $('[data-binding="'+sliderInputId+'"]'),
                        currency = +$('#switchCurrency').val(),
                        currentValue = +sliderValue;

                    if(self.isDefined($sliderOutput)){
                        $sliderOutput.val(currentValue);
                    }

                    if(sliderInputId === 'switchCurrency'){
                        if(currency) {
                            $slider.addClass('checked')
                        } else {
                            $slider.removeClass('checked')
                        }
                    }

                    if(!$sliderHandle.hasClass('is-dragging')) {

                        sliderState[sliderInputId] = {
                            currentValue: currentValue,
                            minValue: +$sliderInput.attr('min'),
                            maxValue: +$sliderInput.attr('max'),
                            step: +$sliderInput.attr('step')
                        };

                        if(self.isDefined(self.state.euroRate) && sliderInputId === 'grossInvoice'){
                            self.state.grossInvoiceInPln.currentValue = currency ? (currentValue*self.state.euroRate) : currentValue;
                            self.state.grossInvoiceInEuro.currentValue = currency ? currentValue : (currentValue/self.state.euroRate);
                        }


                        if(sliderInputId === 'switchCurrency' && self.isDefined(self.state.euroRate)){
                            self.currencySwitchHandler({data: {self: self, $slider: $slider }});
                        } else {
                            self.setState(sliderState, sliderInputId + ' changed.zf.slider');
                        }
                    }
                }

                return false;
            });

            this.$sliderOutput.on('change', this.outputHandler);

            this.$app.on('stateUpdate', {self: this}, this.stateUpdateHandler);
        },
        outputHandler: function(){
            var $sliderInput = $('#'+$(this).data('binding')),
                $slider = $sliderInput.parents('[data-slider]');

            $sliderInput.val($(this).val());
            $slider.foundation('_reflow');
        },
        sliderBtnHandler: function (e) {
            var self = e.data.self, newValue,
                $btn = $(this),
                change = +$btn.data('value'),
                $sliderWrapper = $btn.parents('.js-slider'),
                $slider = $sliderWrapper.find('[data-slider]'),
                sliderInputId = $sliderWrapper.find('[aria-controls]').attr('aria-controls'),
                $sliderInput = $('#'+sliderInputId),
                sliderInputValue = +$sliderInput.val(),
                sliderMin = +$sliderInput.attr('min'),
                sliderMax = +$sliderInput.attr('max'),
                sliderStep = $slider.data('step');

            if(change && sliderInputValue < sliderMax) {
                newValue = sliderInputValue+sliderStep;
                $sliderInput.val(newValue);
                $slider.foundation('_reflow');
            }

            if(!change && sliderInputValue > sliderMin) {
                newValue = sliderInputValue-sliderStep;
                $sliderInput.val(newValue);
                $slider.foundation('_reflow');
            }

            return false;
        },
        setState: function(newState, caller){
            this.state = Object.assign({}, this.state, newState);
            this.$app.trigger('stateUpdate', [{caller: caller}]);
            // console.log(caller);
            // console.log(this.state)
        },
        stateUpdateHandler: function(e, data){
            var self = e.data.self;
            self.calculateTotalCost(data);
        },
        // --------- checkbox version -----------
        // currencySwitchHandler: function(e){
        //     var self = e.data.self, initial = e.data.initial,
        //         isChecked = $(this).is(':checked'),
        //         currencyType = isChecked ? 'EURO' : 'PLN',
        //         currencyData = isChecked ? self.state.grossInvoiceInEuro : self.state.grossInvoiceInPln,
        //         $slider = self.sliderArray[1].$element;
        //
        //     self.updateLabels({
        //         $slider: $slider,
        //         labelLeftTpl: '<strong>' + currencyData.minValue + '</strong> <span>' + currencyType + '</span>',
        //         labelRightTpl: '<strong>' + currencyData.maxValue  + '</strong> <span>' + currencyType + '</span>',
        //         sliderOutputTpl: currencyType + ' brutto'
        //     });
        //
        //     self.setState({currency: currencyType}, 'currencySwitchHandler-setCurrency');
        //     self.updateGrossInvoiceSlider(isChecked, initial);
        //     Foundation.reInit($($('[data-slider]')[1]));
        //     // Foundation.reInit(self.sliderArray[1])
        // },
        currencySwitchHandler: function(e){
            var self = e.data.self, initial = e.data.initial,
                $input = e.data.$slider.find('[type="hidden"]'),
                isChecked = +$input.val() === 1 ? true : false,
                currencyType = isChecked ? 'EURO' : 'PLN',
                currencyData = isChecked ? self.state.grossInvoiceInEuro : self.state.grossInvoiceInPln,
                $slider = self.sliderArray[1].$element;

            if(!$slider.hasClass('js-slider-switch')) {
                self.updateLabels({
                    $slider: $slider,
                    labelLeftTpl: '<strong>' + currencyData.minValue + '</strong> <span>' + currencyType + '</span>',
                    labelRightTpl: '<strong>' + currencyData.maxValue  + '</strong> <span>' + currencyType + '</span>',
                    sliderOutputTpl: currencyType + ' brutto'
                });
            }


            self.setState({currency: currencyType}, 'currencySwitchHandler-setCurrency');

            self.updateGrossInvoiceSlider(isChecked, initial);

            Foundation.reInit($($('[data-slider]')[1]));
            // Foundation.reInit($('[data-slider]'));

        },
        recalculate: function(){
            var sliderStateInEuro = {},
                grossInvoiceInEuro = (this.state.grossInvoice.currentValue/this.state.euroRate).toFixed(2),
                maxValueInEuro = (this.state.grossInvoice.maxValue/this.state.euroRate).toFixed(0),
                minValueInEuro = (this.state.grossInvoice.minValue/this.state.euroRate).toFixed(0);

            return sliderStateInEuro['grossInvoiceInEuro'] = {
                currentValue: +grossInvoiceInEuro,
                minValue: +minValueInEuro,
                maxValue: +maxValueInEuro,
                step: +this.state.grossInvoice.step
            };
        },
        updateGrossInvoiceSlider: function(isChecked, initial){
            var currentState = isChecked ? this.state.grossInvoiceInEuro : this.state.grossInvoiceInPln,
                currentValue = +$('#grossInvoice').val(),
                valueInCurrency = isChecked ? this.state.grossInvoiceInEuro.currentValue.toFixed(2) : this.isDefined(initial) ? currentValue : this.state.grossInvoiceInPln.currentValue.toFixed(2);

            if(this.isDefined(currentState) ){
                this.updateSlider(1, {
                    start: +currentState.minValue,
                    end: +currentState.maxValue,
                    step: +currentState.step,
                    initialStart: +valueInCurrency,
                    initialEnd: +currentState.step
                });
            }
        },

        getData: function(url){
            return $.get(url);
        },
        getCurrencyData: function(){
            var self = this, tableCData, tableAData = this.getData('https://api.nbp.pl/api/exchangerates/rates/A/EUR/today/');

            tableAData.done(function(data){
                self.setState({euroRate: +(data.rates[0].mid).toFixed(2) }, ' tableAData - set currency');
                self.$currencySwitch.removeAttr('disabled');
                self.$currencySwitch.parents('.js-slider-switch').removeClass('disabled');
                if(self.isDefined(self.state.grossInvoice)) {
                    self.setState({
                        grossInvoiceInEuro: self.recalculate()
                    }, ' recalculate by tableAData');
                }

                self.currencySwitchHandler( { data: {self: self, initial: true, $slider: $(".js-slider-switch")} });

            });

            tableAData.fail(function(error){
                console.warn(error.statusText);
                self.diff.reject(error)
            });

            this.diff.fail(function(error){
                self.tableCData = self.getData('https://api.nbp.pl/api/exchangerates/rates/C/EUR/today/');
                self.tableCData.done(function(data){
                    self.setState({euroRate: +data.rates[0].ask}, ' tableCData - set currency');
                    self.$currencySwitch.removeAttr('disabled');
                    self.$currencySwitch.parents('.js-slider-switch').removeClass('disabled');
                    if(self.isDefined(self.state.grossInvoice )) {
                        self.setState({ grossInvoiceInEuro: self.recalculate() }, ' recalculate by tableCData');
                    }
                });
            });
        },
        calculateTotalCost: function(data){
            if(this.isDefined(this.state.grossInvoice) && this.isDefined(this.state.paymentDeadline) ){
                var days = +this.state.paymentDeadline.currentValue,
                    grossInvoiceValue = this.state.grossInvoice.currentValue,
                    grossInvoiceValueToCalculate = this.state.currency === "EURO" ? (grossInvoiceValue*this.state.euroRate).toFixed(2) : grossInvoiceValue,
                    ratio = (days*0.1).toFixed(1),
                    baseCommission = 50,
                    commission =  ((grossInvoiceValueToCalculate*ratio)/100),
                    result = commission < baseCommission ? +baseCommission : +commission;


                if(data.caller !== 'currencySwitchHandler-setCurrency'){
                    this.$total.html('<strong>' + result.toFixed(2) + '</strong> PLN');
                }

            }
        },
        isDefined: function(val) {
            return typeof val !== "undefined";
        }

    };

    $(function () {
        var calc = new Calculator();
        // window.calc = calc;
    });

})(jQuery);
