/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

define(['require',
    'backbone',
    'hbs!tmpl/search/save/SaveModalLayoutView_tmpl',
    'utils/Utils',
    'modules/Modal',
    'utils/UrlLinks',
    'platform',
    'models/VSearch',
    'utils/CommonViewFunction',
    'utils/Messages'
], function(require, Backbone, SaveModalLayoutViewTmpl, Utils, Modal, UrlLinks, platform, VSearch, CommonViewFunction, Messages) {


    var SaveModalLayoutView = Backbone.Marionette.LayoutView.extend({
        _viewName: 'SaveModalLayoutView',
        template: SaveModalLayoutViewTmpl,
        regions: {},
        ui: {
            saveAsName: "[data-id='saveAsName']"
        },
        templateHelpers: function() {
            return {
                selectedModel: this.selectedModel ? this.selectedModel : null
            };
        },
        events: function() {
            var events = {};
            return events;
        },
        initialize: function(options) {
            var that = this;
            _.extend(this, _.pick(options, 'selectedModel', 'collection', 'getValue', 'isBasic', 'saveObj'));
            if (this.selectedModel) {
                var modelDetail = this.selectedModel.toJSON();
                modelDetail.name = _.unescape(modelDetail.name);
                this.selectedModel = modelDetail;
            }

            this.model = new VSearch();
            if (this.saveObj) {
                this.onCreateButton();
            } else {
                var modal = new Modal({
                    titleHtml: true,
                    title: '<span>' + (this.selectedModel ? 'Rename' : 'Save') + (this.isBasic ? " Basic" : " Advanced") + ' Custom Filter</span>',
                    content: this,
                    cancelText: "Cancel",
                    okCloses: false,
                    okText: this.selectedModel ? 'Update' : 'Save',
                    allowCancel: true
                }).open();
                modal.$el.find('button.ok').attr("disabled", "true");
                this.ui.saveAsName.on('keyup', function(e) {
                    modal.$el.find('button.ok').removeAttr("disabled");
                });
                this.ui.saveAsName.on('keyup', function(e) {
                    if ((e.keyCode == 8 || e.keyCode == 32 || e.keyCode == 46) && e.currentTarget.value.trim() == "") {
                        modal.$el.find('button.ok').attr("disabled", "true");
                    }
                });
                modal.on('ok', function() {
                    modal.$el.find('button.ok').attr("disabled", "true");
                    that.onCreateButton(modal);
                });
                modal.on('closeModal', function() {
                    modal.trigger('cancel');
                });
            }
        },
        onCreateButton: function(modal) {
            var that = this,
                obj = { name: this.ui.saveAsName.val ? _.escape(this.ui.saveAsName.val()) : null };
            if (this.selectedModel) {
                // Update Name only.
                var saveObj = this.selectedModel;
                saveObj.name = obj.name;
            } else {
                obj.value = this.getValue();
                if (this.saveObj) {
                    // Save search Filter
                    _.extend(obj, this.saveObj);
                }
                var saveObj = CommonViewFunction.generateObjectForSaveSearchApi(obj);
                if (this.isBasic) {
                    saveObj['searchType'] = "BASIC";
                } else {
                    saveObj['searchType'] = "ADVANCED";
                }
            }
            this.model.urlRoot = UrlLinks.saveSearchApiUrl();
            this.model.save(saveObj, {
                type: (saveObj.guid ? 'PUT' : 'POST'),
                success: function(model, data) {
                    if (that.collection) {
                        if (saveObj.guid) {
                            var collectionRef = that.collection.find({ guid: data.guid });
                            if (collectionRef) {
                                collectionRef.set(data);
                            }
                            Utils.notifySuccess({
                                content: _.unescape(obj.name) + Messages.editSuccessMessage
                            });
                        } else {
                            that.collection.add(data);
                            Utils.notifySuccess({
                                content: _.unescape(obj.name) + Messages.addSuccessMessage
                            });
                        }
                    }
                    if (that.callback) {
                        that.callback();
                    }

                }
            });
            if (modal) {
                modal.trigger('cancel');
            }
        }
    });
    return SaveModalLayoutView;
});