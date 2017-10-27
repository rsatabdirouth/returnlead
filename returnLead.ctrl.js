(function () {
    'use strict';

    angular
        .module('comp.returnLeadApp')
        .controller('ReturnLeadCtrl', ReturnLeadCtrl);

    ReturnLeadCtrl.$inject = ['$state','$http', '$scope', '$q', '$mdDialog', 'SherlockService', 'utilityService'];

    function ReturnLeadCtrl($state,$http, $scope, $q, $mdDialog, SherlockService, utilityService) {
        'use strict';
        var vm = this;
        vm.advanceSearchToggle = false;
        vm.leadFilter = {
            productName : ''
            //    leadIds: '',
            //    buyerRefIds: '',
            //    startDate: '',
            //    endDate: '',
            //    buyerId: 0,
            //    productId: 0,
            //    source: '',
            //    returned: ''
        };
        vm.search = search;
        vm.regexLeadId = "[0-9]+( [0-9]+)*";//here space is separator
        vm.regexRefId = "[A-Za-z0-9]+( [A-Za-z0-9]+)*";//here space is separator
        vm.buyers = getBuyers();
        vm.products = [];        
        vm.getBuyerProducts = getBuyerProducts;
        vm.getBuyerProductsWithParentChild = getBuyerProductsWithParentChild;
        vm.sources = [{
            value: null,
            name: 'All'
        }, {
            value: 'google',
            name: 'google'
        }, {
            value: 'gsl',
            name: 'Google Site Link'
        }, {
            value: 'msn',
            name: 'MSN'
        }, {
            value: 'msl',
            name: 'Microsoft Site Link'
        }, {
            value: 'email-TGVvQHRwbW4uY28udWs=',
            name: 'Email-Leo'
        },
        {
            value: 'email-cmFqYmVlcg==',
            name: 'Email-Rajbeer'
        },
        {
            value: 'email-bWFsZ29yemF0YUBhYmFjdXMtbWFya2V0aW5nLmNvbQ==',
            name: 'Email-Abacus Marketing SL'
        }
        ];        
        vm.leads = [];
        vm.leadCount = 0;
        vm.selectedLeads = [];
        vm.selectedLead = [];
        vm.query = {
            '$orderby': 'LeadId',
            '$skip':0,
            '$top': 50            
        };
        vm.page = 1; // vm.query['$skip'] > 0 ? vm.query['$top'] / vm.query['$skip'] : 1;
        vm.orderBy = '-LeadId';
        vm.limit = 50;
        vm.reOrder = reOrder;
        vm.OnLeadSelect = OnLeadSelect;
        vm.limitOptions = [10, 20, 50];
        vm.OnPaginate = OnPaginate;
        vm.pageSelect = pageSelect;
        vm.selectAll = false;
        vm.toggleSelectAll = toggleSelectAll;
        vm.toggleReturn = toggleReturn;
        vm.isCheckedAll = isCheckedAll;
        vm.isIndeterminate = isIndeterminate;
        vm.redirectLeadDetail = redirectLeadDetail;
        active();
        function active() {
            getProductsWithParentChild();
        }
        function search() {
            var query = buildQuery();
           SherlockService.ReturnLead.get(query, function (data) {
               vm.leads = data.Items;             
                vm.leadCount = data.Count;               
            });
        }
        
        function getBuyers() {
            return SherlockService.Buyers.query();
        }
        function getBuyerProductsWithParentChild(buyerId) {
            getProductsWithParentChild();
            if (buyerId>0) {
                vm.products.$promise.then(function () {
                    var buyerProducts = getBuyerProducts(buyerId);
                    buyerProducts.$promise.then(function () {
                        angular.forEach(vm.products, function (product) {
                            product.isHide = true;
                            angular.forEach(buyerProducts, function (buyerProduct) {
                                if (buyerProduct.ID === product.ID || buyerProduct.ParentProductId === product.ID) {
                                    product.isHide = false;
                                }
                            });
                        });
                    });
                });
            }
        }
        function getProductsWithParentChild() {
            vm.products = getProducts();
            //vm.products.$promise.then(function () {
            //    for (var i = 0; i < vm.products.length; i++) {
            //        vm.products[i].isParent = false;
            //        vm.products[i].hasChild = false;
            //        if (vm.products[i].ID == vm.products[i].ParentProductId) {
            //            vm.products[i].isParent = true;
            //            vm.products[i].hasChild = false;
            //            angular.forEach(vm.products, function (item) {
            //                if (item.ID != vm.products[i].ID) {
            //                    if (item.ParentProductId == vm.products[i].ID) {
            //                        vm.products[i].hasChild = true;
            //                        //console.log(vm.products[i]);
            //                        return;
            //                    }
            //                }
            //            });
            //        }
            //    }
            //});
        }
        function getBuyerProducts(buyerId) {
            return SherlockService.BuyerAllProd.query({ buyerId: buyerId });
        }
        function getProducts() {
            return SherlockService.Products.query();
        }

        function buildQuery() {            
            //LeadQuery             
            if (vm.query.hasOwnProperty('leadIds'))
                delete vm.query['leadIds'];
                      
            if (vm.query.hasOwnProperty('buyerRefIds'))
                delete vm.query['buyerRefIds'];

            if (vm.query.hasOwnProperty('productName'))
                delete vm.query['productName'];

            if (vm.query.hasOwnProperty('$filter'))
                delete vm.query['$filter'];          
           
            if (vm.leadFilter.leadIds) {
                vm.query['leadIds'] = vm.leadFilter.leadIds;
            }            

            //BuyerReferenceQuery            
            if (vm.leadFilter.buyerRefIds) {
                vm.query['buyerRefIds'] = vm.leadFilter.buyerRefIds;
            }

            //DateRangeQuery
            var dateRange = '';
            if (vm.leadFilter.startDate || vm.leadFilter.endDate) {
                dateRange = "TransferDateTime ge datetime'" + moment(vm.leadFilter.startDate).format('YYYY-MM-DD') + "' and TransferDateTime le datetime'" + moment(vm.leadFilter.endDate).add(1, 'day').format('YYYY-MM-DD') + "'";;
            }

            //Selected BuyerQuery
            var buyerQuery = null;
            if (vm.leadFilter.buyerId > 0) {
                buyerQuery = 'BuyerId eq ' + vm.leadFilter.buyerId;
            }
            //var productQuery = null;
            if (vm.leadFilter.productName !== '') {
                vm.query['productName'] = vm.leadFilter.productName;
                //productQuery = 'ProductId eq ' + vm.leadFilter.productId;
            }
            var returnQuery = null;
            if (vm.leadFilter.returned !== undefined && vm.leadFilter.returned !== null) {
                returnQuery = 'Returned eq ' + vm.leadFilter.returned;
            }
            var sourceQuery = null;            
            if (vm.leadFilter.source) {                
                sourceQuery = "Source eq '" + vm.leadFilter.source + "'";
            }
            vm.query['$orderby'] = vm.orderBy;
            if (vm.orderBy && vm.orderBy.charAt(0) === '-') {
                vm.query['$orderby'] = vm.orderBy.slice(1,vm.orderBy.length) + ' desc';
            }
            
            vm.query['$skip'] = (vm.page - 1) * vm.limit;
            vm.query['$top'] = vm.limit;
            var filter = joinQuery(dateRange, buyerQuery, returnQuery, sourceQuery, 'and');
            if (filter) {
                vm.query['$filter'] = filter;
            }

            return vm.query;
        }

        function joinQuery() {
            try {
                var operator = arguments[arguments.length - 1];
                if (!operator) {
                    return '';
                }
                var args = [];
                for (var i = 0; i < arguments.length - 1; i++) {
                    if (arguments[i]) {
                        args.push(arguments[i]);
                    }
                }
                var query = args.join(' ' + operator + ' ');
                return query;
            }
            catch (err) {
                console.log(err);
                return '';
            }

        }
        vm.time = new Date();
        function reOrder(order) {
            vm.orderBy = order;
            search();
        }
        function OnLeadSelect(lead) {
            console.log(lead);
        }
        function OnPaginate(page, limit) {           
            console.log(page,limit);
            search();
        }
        function pageSelect(select) {
            console.log(select);
        }
        function toggleSelectAll(ev, selected) {
            utilityService.dialogConfirm(ev, "Waring!", "Are you sure?", function () {
                vm.selectAll = !selected;
                angular.forEach(vm.leads, function (lead) {
                    lead.Returned = !selected;
                    if (lead.Returned) {
                        lead.Price = 0;
                    }
                });
                SherlockService.ReturnLead.save(vm.leads, function (data) {
                    utilityService.showToast('Update Succesfully');
                });
            }, function () {                
            });
        }
        function toggleReturn(ev, lead) {
            utilityService.dialogConfirm(ev, "Waring!", "Are you sure?", function () {
                var leads = [];
                leads.push(lead);
                SherlockService.ReturnLead.save(leads, function (data) {
                    if (lead.Returned) {
                        lead.Price = 0;
                    }                    
                    utilityService.showToast('Update Succesfully');
                });
            }, function () {
                lead.Returned = !lead.Returned;               
            });           
           
        }
        function isCheckedAll() {            
            if (vm.leads && vm.leads.length > 0) {
                var returnCount = 0;
                angular.forEach(vm.leads, function (lead) {
                    returnCount += lead.Returned ? 1 : 0;
                });                
                return (vm.leads.length === returnCount);
            }          
        }

        function isIndeterminate() {
            if (vm.leads && vm.leads.length > 0) {                
                var returnCount = 0;
                angular.forEach(vm.leads, function (lead) {
                    returnCount += lead.Returned ? 1 : 0;
                });                
                return ( returnCount !== 0 && vm.leads.length !== returnCount);
            }          
        }

        function redirectLeadDetail(leadId) {            
            $state.go('home.lead', { ID: leadId });            
        }
    }
})();