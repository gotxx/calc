;(function($){
	"use strict";

    function Calculator(){
        this.setup();
        this.initSliders();
        this.events();
        this.currencySwitchHandler( { data: {self: this} });
        this.getCurrencyData();
    }


    Calculator.prototype = {
        setup: function(){
            this.state = {};
            this.$app = $('#calc');
            this.$total = $('#totalCost');
            this.$slidersWrappers = $('.js-slider');
            this.$sliders = $('[data-slider]');
            this.$currencySwitch = $("#currencySwitch");
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

            // console.log(self.state)
            console.log('initSliders')
            console.log(self.state.grossInvoice)

            if( self.isDefined(self.state.grossInvoice)){
                inPln = self.state.grossInvoice;
            }
            self.setState({ grossInvoiceInPln: inPln});
        },
        setupSliderData: function($slider){
            // console.log($slider);
            var sliderState = {},
                $sliderInput = $slider.find('input[type="hidden"]'),
                sliderInputId = $slider.find('[aria-controls]').attr('aria-controls'),
                sliderValue = $sliderInput.val();

            // console.log($sliderInput)
            console.log($sliderInput);
            console.log(sliderInputId);
            console.log(sliderValue);



            sliderState[sliderInputId] = {
                currentValue: +sliderValue,
                minValue: +$sliderInput.attr('min'),
                maxValue: +$sliderInput.attr('max'),
                step: +$sliderInput.attr('step')
            };

            this.setState(sliderState);
        },
        updateSlider: function(sliderIndex, newOptions){
            var currentOptions = this.sliderArray[sliderIndex].options;
            this.sliderArray[sliderIndex].options = Object.assign({}, currentOptions, newOptions);
            // console.log(this.sliderArray[sliderIndex].options )

        },
        events: function(){
            var self = this;
            this.$slidersWrappers.on('click', '.js-btn', {self: this}, this.sliderBtnHandler);
            this.$currencySwitch.on('change', {self: this}, this.currencySwitchHandler);
            this.$sliders.on('changed.zf.slider', function(e){
                var $slider = $(this), sliderState = {},
                    $sliderInput = $slider.find('input[type="hidden"]'),
                    sliderInputId = $slider.find('[aria-controls]').attr('aria-controls'),
                    sliderValue = $sliderInput.val(),
                    $sliderOutput = $('[data-binding="'+sliderInputId+'"]');


                console.log($sliderInput);
                console.log($sliderInput.val());
                $sliderOutput.val(+sliderValue);

                sliderState[sliderInputId] = {
                    currentValue: +sliderValue,
                    minValue: +$sliderInput.attr('min'),
                    maxValue: +$sliderInput.attr('max'),
                    step: +$sliderInput.attr('step'),
                    curr: self.state.currency
                };

                self.setState(sliderState);
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
        setState: function(newState){
            this.state = Object.assign({}, this.state, newState);
            this.$app.trigger('stateUpdate');
            // console.log(this.state);
        },
        stateUpdateHandler: function(e){
            var self = e.data.self,
                curr = self.isDefined(self.state.currency) && self.state.currency;

            console.log(self.state);

            self.calculateTotalCost(curr);
            console.log('state update');
        },
        currencySwitchHandler: function(e){
            var self = e.data.self, inEuro = {}, inPln = {},
                isChecked = $(this).is(':checked'),
                currencyType = isChecked ? 'euro' : 'pln';

            self.setState({currency: currencyType});

            self.updateGrossInvoiceSlider(isChecked);
            Foundation.reInit($($('[data-slider]')[0]))
            // Foundation.reInit(self.sliderArray[0])
        },
        recalculate: function(){
            var sliderStateInEuro = {},
                grossInvoiceInEuro = (this.state.grossInvoice.currentValue/this.state.euroRate).toFixed(2),
                maxValueInEuro = (this.state.grossInvoice.maxValue/this.state.euroRate).toFixed(0),
                minValueInEuro = (this.state.grossInvoice.minValue/this.state.euroRate).toFixed(0);

            console.log(grossInvoiceInEuro)
            console.log(maxValueInEuro)
            console.log(minValueInEuro)


            return sliderStateInEuro['grossInvoiceInEuro'] = {
                currentValue: +grossInvoiceInEuro,
                minValue: +minValueInEuro,
                maxValue: +maxValueInEuro,
                step: +this.state.grossInvoice.step
            };

        },
        updateGrossInvoiceSlider: function(isChecked){
            console.log('updateGrossInvoiceSlider');
            console.log($('#grossInvoice'));
            var currentState = isChecked ? this.state.grossInvoiceInEuro : this.state.grossInvoiceInPln,
                currentValue = +$('#grossInvoice').val(),
                valueInCurrency = isChecked ? Math.round((currentValue/this.state.euroRate)*100)/100 : Math.round((currentValue*this.state.euroRate)*100)/100;

            console.log(currentValue);

            if(this.isDefined(currentState) ){
                // console.log(currentState);
                this.updateSlider(0, {
                    start: +currentState.minValue,
                    end: +currentState.maxValue,
                    step: +currentState.step,
                    initialStart: valueInCurrency,
                    initialEnd: +currentState.step
                });

            }

        },
        getData: function(url){
            return $.get(url);
        },
        getCurrencyData: function(){
            var self = this, tableCData, tableAData = this.getData('http://api.nbp.pl/api/exchangerates/rates/A/EUR/today/');

            tableAData.done(function(data){
                self.setState({euroRate: (data.rates[0].mid).toFixed(2) });
                self.$currencySwitch.removeAttr('disabled').removeClass('disabled');

                if(self.isDefined(self.state.grossInvoice)) {
                    self.setState({ grossInvoiceInEuro: self.recalculate() });
                }

            });

            tableAData.fail(function(error){
                console.warn(error);
                self.diff.reject(error)
            });

            this.diff.fail(function(error){
                self.tableCData = self.getData('http://api.nbp.pl/api/exchangerates/rates/C/EUR/today/');
                self.tableCData.done(function(data){
                    console.log(data.rates[0].ask);
                    self.setState({euroRate: data.rates[0].ask});
                    self.$currencySwitch.removeAttr('disabled').removeClass('disabled');
                    if(self.isDefined(self.state.grossInvoice )) {
                        self.setState({ grossInvoiceInEuro: self.recalculate() });
                    }
                });
            });
        },
        calculateTotalCost: function(){
            console.log('calculateTotalCost')
            if(this.isDefined(this.state.grossInvoice) && this.isDefined(this.state.paymentDeadline) ){
                var days = +this.state.paymentDeadline.currentValue,
                    grossInvoiceValue = this.state.grossInvoice.currentValue,
                    ratio = (days*0.1).toFixed(1),
                    commission = ((grossInvoiceValue*ratio)/100).toFixed(2);

                console.log('this.state.grossInvoice.currentValue');
                console.log(this.state.grossInvoice.currentValue);

                this.$total.text(commission + ' ' + this.state.grossInvoice.curr);
            }
        },
        isDefined: function(val) {
            return typeof val !== "undefined";
        }

    };

    $(function () {
        // $(document).foundation();
        var calc = new Calculator();
    })

})(jQuery);
