import React, { useState, useCallback, useEffect } from 'react';
import type { FormDataState, ItemData } from './types';
import { FormInput } from './components/FormInput';
import { Header } from './components/Header';
import { CheckboxGroup } from './components/CheckboxGroup';
import { FormSection } from './components/FormSection';
import { FileUpload } from './components/FileUpload';
import { initialFormData, initialItemData, POLO_SIZES, WINTER_JACKET_SIZES, PROPERTIES, FLEECE_ONLY_PROPERTIES } from './constants';
import { SearchableSelect } from './components/SearchableSelect';
import type { MainChoice, GeneralCategory, SignageType } from './types';

const calculateItemPrice = (item: ItemData): number => {
    if (!item.mainChoice) return 0;
    
    if (item.mainChoice === 'Onboarding (New-Hire)') {
        // 4 shirts ($30 each), 1 hat ($20), 1 badge ($15)
        return (4 * 30) + 20 + 15; // 155
    } else if (item.mainChoice === 'Existing Employee') {
        if (item.generalCategory === 'Polo Shirts') {
            const totalShirts = Object.values(item.poloQuantities).reduce((sum, qty) => sum + (Number(qty) || 0), 0);
            return totalShirts * 30;
        } else if (item.generalCategory === 'Fleece Jackets') {
            const totalFleece = Object.values(item.hoodieQuantities).reduce((sum, qty) => sum + (Number(qty) || 0), 0);
            return totalFleece * 38;
        } else if (item.generalCategory === 'Winter Jackets') {
            const standardSizes = ['Extra Small', 'Small', 'Medium', 'Large', 'XL', 'XS'];
            return Object.entries(item.winterJacketQuantities).reduce((sum, [size, qty]) => {
                const count = Number(qty) || 0;
                if (count <= 0) return sum;
                const rate = standardSizes.includes(size) ? 70 : 73;
                return sum + (count * rate);
            }, 0);
        } else if (item.generalCategory === 'Hats') {
            return (Number(item.hatQuantity) || 0) * 20;
        } else if (item.generalCategory === 'Beanies') {
            return (Number(item.winterBeanieQuantity) || 0) * 18;
        } else if (item.generalCategory === 'Replacement ID-Badge') {
            return 15;
        }
    }
    return 0;
};

const formatInquiryForEmail = (data: FormDataState): string => {
    let summary = `New Form Request\n\n`;
    summary += `== Contact Information ==\n`;
    summary += `Name: ${data.customerInfo.name}\n`;
    summary += `Email: ${data.customerInfo.email}\n`;
    summary += `Phone: ${data.customerInfo.phone || 'N/A'}\n`;
    summary += `Property: ${data.customerInfo.property}\n\n`;

    data.items.forEach((item, index) => {
        summary += `== Item #${index + 1} ==\n`;
        summary += `Request Type: ${item.mainChoice}\n`;

        if (item.mainChoice === 'Onboarding (New-Hire)') {
            summary += `Polo Shirt Size: ${item.onboardingShirtSize}\n`;
            summary += `1 Hat (One Size Fits All)\n`;
            summary += `Staff Name: ${item.onboardingStaffName}\n`;
            summary += `Staff Position: ${item.onboardingStaffTitle}\n`;
            summary += `Uploaded ID Badge Files: ${item.onboardingBadgePic.length}\n`;
        } else if (item.mainChoice === 'Existing Employee') {
            summary += `Category: ${item.generalCategory}\n\n`;
            if (item.generalCategory === 'Polo Shirts') {
                summary += `Sizes Requested:\n`;
                Object.entries(item.poloQuantities).forEach(([size, qty]) => {
                    if (Number(qty) > 0) summary += `  - ${size}: ${qty}\n`;
                });
            } else if (item.generalCategory === 'Fleece Jackets') {
                summary += `Sizes Requested:\n`;
                Object.entries(item.hoodieQuantities).forEach(([size, qty]) => {
                    if (Number(qty) > 0) summary += `  - ${size}: ${qty}\n`;
                });
            } else if (item.generalCategory === 'Winter Jackets') {
                summary += `Sizes Requested:\n`;
                Object.entries(item.winterJacketQuantities).forEach(([size, qty]) => {
                    if (Number(qty) > 0) summary += `  - ${size}: ${qty}\n`;
                });
            } else if (item.generalCategory === 'Hats') {
                 summary += `Quantity (One Size Fits All): ${item.hatQuantity}\n`;
            } else if (item.generalCategory === 'Beanies') {
                 summary += `Style: ${item.winterBeanieStyle}\n`;
                 summary += `Quantity (One Size Fits All): ${item.winterBeanieQuantity}\n`;
            } else if (item.generalCategory === 'Replacement ID-Badge') {
                 summary += `Staff Name: ${item.replacementStaffName}\n`;
                 summary += `Staff Position: ${item.replacementStaffTitle}\n`;
                 summary += `Uploaded Replacement Badge Files: ${item.replacementBadgePic.length}\n`;
            }
        } else if (item.mainChoice === 'Signage (Coming Soon)') {
             summary += `Signage Type: ${item.signageType}\n`;
             if (item.signageType === 'Doormats') summary += `Size: ${item.doormatSize}\n`;
             if (item.signageType === 'Yard signs') summary += `Size: ${item.yardSignSize}\n`;
             if (item.signageType === 'Banners') summary += `Size: ${item.bannerSize} (Note: All banners are 27in height)\n`;
             summary += `Quantity: ${item.signageQuantity}\n`;
        }
        summary += `\n`;
    });

    const total = data.items.reduce((sum, item) => sum + calculateItemPrice(item), 0);
    if (total > 0) {
        summary += `== Order Cost ==\n`;
        summary += `Total: $${total.toFixed(2)}\n\n`;
    }

    summary += `Thank you for submitting your request!`;

    return summary;
};

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xrevdldy';

const App: React.FC = () => {
  const [data, setData] = useState<FormDataState>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);
  const [showBeanieModal, setShowBeanieModal] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowBeanieModal(false);
    };
    if (showBeanieModal) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showBeanieModal]);

  const isFleeceOnlyProperty = FLEECE_ONLY_PROPERTIES.includes(data.customerInfo.property);

  const handleCustomerInfoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setData(prev => {
      let updatedItems = prev.items;
      if (name === 'property' && FLEECE_ONLY_PROPERTIES.includes(value)) {
        // Reset any selected Jacket if changing to a Fleece-only property
        updatedItems = prev.items.map(item => {
          let newItem = { ...item };
          if (newItem.generalCategory === 'Winter Jackets') {
            newItem.generalCategory = '';
            newItem.winterJacketQuantities = {};
          }
          return newItem;
        });
      }
      return { 
        ...prev, 
        customerInfo: { ...prev.customerInfo, [name]: value },
        items: updatedItems
      };
    });
  }, []);

  const updateItemField = (index: number, field: keyof ItemData, value: any) => {
    setData(prev => {
        const newItems = [...prev.items];
        let item = { ...newItems[index], [field]: value };
        
        // Clear sub-fields when main choices change
        if (field === 'mainChoice') {
            item.onboardingShirtSize = '';
            item.onboardingBadgePic = [];
            item.generalCategory = '';
        }
        if (field === 'generalCategory') {
            item.signageType = '';
            item.signageQuantity = '';
        }
        if (field === 'signageType') {
            item.doormatSize = '';
            item.yardSignSize = '';
            item.bannerSize = '';
        }
        
        newItems[index] = item;
        return { ...prev, items: newItems };
    });
  };

  const updateQuantity = (index: number, categoryField: 'poloQuantities' | 'hoodieQuantities' | 'winterJacketQuantities', size: string, value: string) => {
    setData(prev => {
        const newItems = [...prev.items];
        newItems[index] = {
            ...newItems[index],
            [categoryField]: {
                ...newItems[index][categoryField],
                [size]: value
            }
        };
        return { ...prev, items: newItems };
    });
  };
  
  const handleAddItem = () => {
    const form = document.querySelector('form');
    if (form && !form.reportValidity()) {
        return;
    }

    setData(prev => ({
        ...prev,
        items: [...prev.items, initialItemData()]
    }));
  };

  const handleRemoveItem = (index: number) => {
    setData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const form = document.querySelector('form');
    if (form && !form.reportValidity()) {
        return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);
    
    // GET THE SUBSCRIBER'S EMAIL FROM THE URL
    const urlParams = new URLSearchParams(window.location.search);
    const bizParam = urlParams.get('biz');
    const subscriberEmail = bizParam ? decodeURIComponent(bizParam).trim() : 'aramirez@jrk.com';

    const formData = new FormData();
    
    // Identifies the Subscriber and Customer
    formData.append('Business_Email', subscriberEmail);
    formData.append('Customer_Name', data.customerInfo.name);
    formData.append('Customer_Email', data.customerInfo.email);
    formData.append('Submission_Time', new Date().toLocaleString());
    
    const emailSummary = formatInquiryForEmail(data);
    formData.append('Order_Details', emailSummary);

    // Standard Formspree metadata
    formData.append('_replyto', data.customerInfo.email);
    formData.append('_subject', `New TWO Staff Request from ${data.customerInfo.name}`);

    // Handle file attachments
    data.items.forEach((item, index) => {
        if (item.mainChoice === 'Onboarding (New-Hire)') {
            item.onboardingBadgePic.forEach((file, fileIdx) => {
                formData.append(`item_${index + 1}_id_badge_file_${fileIdx + 1}`, file);
            });
        } else if (item.mainChoice === 'Existing Employee' && item.generalCategory === 'Replacement ID-Badge') {
            item.replacementBadgePic.forEach((file, fileIdx) => {
                formData.append(`item_${index + 1}_replacement_badge_file_${fileIdx + 1}`, file);
            });
        }
    });

    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        setSubmitStatus('success');
        setData(initialFormData);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      console.error(error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-12">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
        <Header />
        
        {submitStatus === 'success' && (
          <div className="mt-8 bg-green-50 border border-green-200 text-green-800 p-6 rounded-2xl shadow-sm text-center">
            <h3 className="text-2xl font-bold mb-2">Request Submitted!</h3>
            <p className="text-lg">Thank you! Your request details have been securely sent. We will be in touch shortly.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-12">
          {/* CONTACT INFO */}
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
            <h2 className="text-3xl font-bold text-gray-800 border-b pb-4 mb-6">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <FormInput
                label="Name"
                name="name"
                value={data.customerInfo.name}
                onChange={handleCustomerInfoChange}
                required
              />
              <FormInput
                label="Email"
                name="email"
                type="email"
                value={data.customerInfo.email}
                onChange={handleCustomerInfoChange}
                required
              />
              <FormInput
                label="Phone Number"
                name="phone"
                type="tel"
                value={data.customerInfo.phone}
                onChange={handleCustomerInfoChange}
              />
              <SearchableSelect
                label="Property"
                name="property"
                value={data.customerInfo.property}
                options={PROPERTIES}
                onChange={(value) => handleCustomerInfoChange({ target: { name: 'property', value } } as unknown as React.ChangeEvent<HTMLInputElement>)}
                required
              />
            </div>
          </div>

          <div className="space-y-12">
            {data.items.map((item, index) => (
              <div key={item.id} id={`item-${index}`} className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
                <div className="flex justify-between items-center border-b pb-4 mb-6">
                  <h2 className="text-3xl font-bold text-gray-800">Item #{index + 1}</h2>
                  {data.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-600 hover:text-red-800 font-semibold"
                    >
                      Remove Item
                    </button>
                  )}
                </div>
                
                <FormSection
                  title={
                    <span className="inline-flex flex-wrap items-baseline gap-x-2">
                      <span>Select Request Type</span>
                      <span className="text-sm md:text-base font-normal text-red-600">
                        (Request Winterwear for New Staff through the <strong className="font-bold text-red-600">Existing Employee</strong> selection)
                      </span>
                    </span>
                  }
                  step={1}
                >
                  <CheckboxGroup 
                     name={`mainChoice_${index}`} 
                     options={['Onboarding (New-Hire)', 'Existing Employee', 'Signage (Coming Soon)']} 
                     selectedValue={item.mainChoice} 
                     onChange={v => updateItemField(index, 'mainChoice', v)} 
                     columns={3} 
                     disabledOptions={['Signage (Coming Soon)']}
                     required
                  />
                </FormSection>

                 {item.mainChoice === 'Onboarding (New-Hire)' && (
                  <div className="mt-8 space-y-8 animate-fade-in">
                     <FormSection title={
                        <div className="flex items-center gap-4 inline-flex">
                            <span>Polo Shirt Size</span>
                            <a href="/sizing-chart.png" target="_blank" rel="noopener noreferrer" className="text-sm font-normal text-indigo-600 hover:underline inline-flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                View Sizing Chart
                            </a>
                        </div>
                     } step={2} required>
                        <p className="text-sm text-indigo-700 font-medium mb-3 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                            * Note: Each onboarding staff will receive 4 polo shirts in the size selected.
                        </p>
                        <CheckboxGroup 
                             name={`onboardingShirtSize_${index}`} 
                             options={POLO_SIZES} 
                             selectedValue={item.onboardingShirtSize} 
                             onChange={v => updateItemField(index, 'onboardingShirtSize', v)} 
                             columns={4} 
                             required
                        />
                     </FormSection>

                      <FormSection title="Submit Staff ID Badge Picture" step={3} required>
                        <div className="space-y-6">
                           <FileUpload maxFiles={1} onFilesChange={files => updateItemField(index, 'onboardingBadgePic', files)} required />
                           
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                             <div>
                               <FormInput 
                                 label="Enter First & Last Name" 
                                 name={`onboardingStaffName_${index}`}
                                 value={item.onboardingStaffName}
                                 onChange={e => updateItemField(index, 'onboardingStaffName', e.target.value)}
                                 required
                               />
                             </div>
                             <FormInput 
                               label="Enter Staff Position" 
                               name={`onboardingStaffTitle_${index}`}
                               value={item.onboardingStaffTitle}
                               onChange={e => updateItemField(index, 'onboardingStaffTitle', e.target.value)}
                               required
                             />
                           </div>

                           <div className="mt-6 flex items-start space-x-3 bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                             <div className="flex items-center h-5 mt-1">
                               <input
                                 id={`onboardingBadgeGuidelinesVerified_${index}`}
                                 name={`onboardingBadgeGuidelinesVerified_${index}`}
                                 type="checkbox"
                                 required
                                 checked={item.onboardingBadgeGuidelinesVerified}
                                 onChange={(e) => updateItemField(index, 'onboardingBadgeGuidelinesVerified', e.target.checked)}
                                 className="focus:ring-indigo-500 h-5 w-5 text-indigo-600 border-gray-300 rounded appearance-auto"
                               />
                             </div>
                             <div className="text-sm">
                               <label htmlFor={`onboardingBadgeGuidelinesVerified_${index}`} className="font-medium text-indigo-900 cursor-pointer">
                                 I verify the submitted image follows the Company guidelines:
                               </label>
                               <ul className="list-disc ml-5 mt-2 text-indigo-800 space-y-1">
                                 <li>The picture must be framed to fit in a cropped square (like a passport photo) and only be of the employee from the shoulders on up.</li>
                                 <li>No sunglasses, headwear, and/or outerwear should be visible in the photo.</li>
                                 <li>The photo must be taken on a plain background, for example a solid-colored wall (while white is preferred, a solid color will suffice).</li>
                               </ul>
                             </div>
                           </div>
                        </div>
                     </FormSection>
                  </div>
                )}

                {item.mainChoice === 'Existing Employee' && (
                  <div className="mt-8 space-y-8 animate-fade-in">
                     <FormSection title="Select Item" step={2}>
                         <CheckboxGroup 
                             name={`generalCategory_${index}`} 
                             options={['Polo Shirts', 'Hats', 'Beanies', 'Fleece Jackets', 'Winter Jackets', 'Replacement ID-Badge']} 
                             selectedValue={item.generalCategory} 
                             onChange={v => updateItemField(index, 'generalCategory', v)} 
                             columns={3} 
                             required
                             disabledOptions={isFleeceOnlyProperty ? ['Winter Jackets'] : []}
                         />
                         <p className="text-sm text-indigo-700 font-medium mt-3 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                             * Note: AZ, FL, CA, LA, and GA properties receive Fleece Jackets. All other properties receive Winter Jackets. Please select accordingly.
                         </p>
                     </FormSection>

                     {item.generalCategory === 'Polo Shirts' && (
                         <FormSection title={
                             <div className="flex items-center gap-4 inline-flex">
                                 <span>Select Sizes and Quantities</span>
                                 <a href="/sizing-chart.png" target="_blank" rel="noopener noreferrer" className="text-sm font-normal text-indigo-600 hover:underline inline-flex items-center gap-1">
                                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                     View Sizing Chart
                                 </a>
                             </div>
                         } step={3} required>
                             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                 {POLO_SIZES.map(size => (
                                     <div key={size}>
                                         <label className="block text-sm font-medium text-gray-700 mb-1">{size}</label>
                                         <input
                                             type="number"
                                             min="0"
                                             className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                             value={item.poloQuantities[size] || ''}
                                             onChange={e => updateQuantity(index, 'poloQuantities', size, e.target.value)}
                                             required={!Object.values(item.poloQuantities).some(qty => Number(qty) > 0)}
                                         />
                                     </div>
                                 ))}
                             </div>
                         </FormSection>
                     )}

                     {item.generalCategory === 'Fleece Jackets' && (
                         <FormSection title={
                             <div className="flex items-center gap-4 inline-flex">
                                 <span>Select Sizes and Quantities</span>
                                 <a href="https://catalog.companycasuals.com/p/5089_TrueNavy/specSheetMeasurements" target="_blank" rel="noopener noreferrer" className="text-sm font-normal text-indigo-600 hover:underline inline-flex items-center gap-1">
                                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                     View Sizing Chart
                                 </a>
                             </div>
                         } step={3} required>
                             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                 {POLO_SIZES.map(size => (
                                     <div key={size}>
                                         <label className="block text-sm font-medium text-gray-700 mb-1">
                                             {size}
                                         </label>
                                         <input
                                             type="number"
                                             min="0"
                                             className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                             value={item.hoodieQuantities[size] || ''}
                                             onChange={e => updateQuantity(index, 'hoodieQuantities', size, e.target.value)}
                                             required={!Object.values(item.hoodieQuantities).some(qty => Number(qty) > 0)}
                                         />
                                     </div>
                                 ))}
                             </div>
                         </FormSection>
                     )}

                     {item.generalCategory === 'Winter Jackets' && (
                         <FormSection title={
                             <div className="flex items-center gap-4 inline-flex">
                                 <span>Select Sizes and Quantities</span>
                                 <a href="https://catalog.companycasuals.com/p/1890_TrNvTrNv/specSheetMeasurements" target="_blank" rel="noopener noreferrer" className="text-sm font-normal text-indigo-600 hover:underline inline-flex items-center gap-1">
                                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                     View Sizing Chart
                                 </a>
                             </div>
                         } step={3} required>
                             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                 {WINTER_JACKET_SIZES.map(size => (
                                     <div key={size}>
                                         <label className="block text-sm font-medium text-gray-700 mb-1">
                                             {size}
                                         </label>
                                         <input
                                             type="number"
                                             min="0"
                                             className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                             value={item.winterJacketQuantities[size] || ''}
                                             onChange={e => updateQuantity(index, 'winterJacketQuantities', size, e.target.value)}
                                             required={!Object.values(item.winterJacketQuantities).some(qty => Number(qty) > 0)}
                                         />
                                     </div>
                                 ))}
                             </div>
                         </FormSection>
                     )}

                     {item.generalCategory === 'Hats' && (
                         <FormSection title="Hat Details" step={3} required>
                             <p className="text-sm text-gray-600 mb-4 block">* Note: One size fits all</p>
                             <FormInput 
                                label="Quantity" 
                                name={`hatQuantity_${index}`} 
                                type="number" 
                                min="1"
                                value={item.hatQuantity} 
                                onChange={e => updateItemField(index, 'hatQuantity', e.target.value)} 
                                required
                             />
                         </FormSection>
                     )}

                     {item.generalCategory === 'Beanies' && (
                         <FormSection title="Beanie Details" step={3} required>
                             <p className="text-sm text-gray-600 mb-4 block">* Note: One size fits all</p>
                             <div className="space-y-6">
                                 <div>
                                     <div className="flex items-center gap-3 mb-2">
                                         <label className="block text-sm font-medium text-gray-700">Style</label>
                                         <button
                                             type="button"
                                             onClick={() => setShowBeanieModal(true)}
                                             className="text-sm font-normal text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
                                         >
                                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                             </svg>
                                             View Beanie Styles
                                         </button>
                                     </div>
                                     <CheckboxGroup 
                                         name={`winterBeanieStyle_${index}`} 
                                         options={['Cuffed', 'Cap']} 
                                         selectedValue={item.winterBeanieStyle} 
                                         onChange={v => updateItemField(index, 'winterBeanieStyle', v)} 
                                         columns={2} 
                                         required
                                     />
                                 </div>
                                 <FormInput 
                                    label="Quantity" 
                                    name={`winterBeanieQuantity_${index}`} 
                                    type="number" 
                                    min="1"
                                    value={item.winterBeanieQuantity} 
                                    onChange={e => updateItemField(index, 'winterBeanieQuantity', e.target.value)} 
                                    required
                                 />
                             </div>
                         </FormSection>
                     )}

                     {item.generalCategory === 'Replacement ID-Badge' && (
                         <FormSection title="Submit Replacement ID-Badge" step={3} required>
                            <div className="space-y-6">
                               <FileUpload maxFiles={1} onFilesChange={files => updateItemField(index, 'replacementBadgePic', files)} required />
                               
                               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                                 <div>
                                   <FormInput 
                                     label="Enter First & Last Name" 
                                     name={`replacementStaffName_${index}`}
                                     value={item.replacementStaffName}
                                     onChange={e => updateItemField(index, 'replacementStaffName', e.target.value)}
                                     required
                                   />
                                 </div>
                                 <FormInput 
                                   label="Enter Staff Position" 
                                   name={`replacementStaffTitle_${index}`}
                                   value={item.replacementStaffTitle}
                                   onChange={e => updateItemField(index, 'replacementStaffTitle', e.target.value)}
                                   required
                                 />
                               </div>

                               <div className="mt-6 flex items-start space-x-3 bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                                 <div className="flex items-center h-5 mt-1">
                                   <input
                                     id={`replacementBadgeGuidelinesVerified_${index}`}
                                     name={`replacementBadgeGuidelinesVerified_${index}`}
                                     type="checkbox"
                                     required
                                     checked={item.replacementBadgeGuidelinesVerified}
                                     onChange={(e) => updateItemField(index, 'replacementBadgeGuidelinesVerified', e.target.checked)}
                                     className="focus:ring-indigo-500 h-5 w-5 text-indigo-600 border-gray-300 rounded appearance-auto"
                                   />
                                 </div>
                                 <div className="text-sm">
                                   <label htmlFor={`replacementBadgeGuidelinesVerified_${index}`} className="font-medium text-indigo-900 cursor-pointer">
                                     I verify the submitted image follows the Company guidelines:
                                   </label>
                                   <ul className="list-disc ml-5 mt-2 text-indigo-800 space-y-1">
                                     <li>The picture must be framed to fit in a cropped square (like a passport photo) and only be of the employee from the shoulders on up.</li>
                                     <li>No sunglasses, headwear, and/or outerwear should be visible in the photo.</li>
                                     <li>The photo must be taken on a plain background, for example a solid-colored wall (while white is preferred, a solid color will suffice).</li>
                                   </ul>
                                 </div>
                               </div>
                            </div>
                         </FormSection>
                     )}
                  </div>
                )}

                {item.mainChoice === 'Signage (Coming Soon)' && (
                    <div className="mt-8 space-y-8 animate-fade-in">
                         <div className="space-y-8">
                             <FormSection title="Select Signage Type" step={2} required>
                                 <CheckboxGroup 
                                     name={`signageType_${index}`} 
                                     options={['Doormats', 'Yard signs', 'Banners']} 
                                     selectedValue={item.signageType} 
                                     onChange={v => updateItemField(index, 'signageType', v)} 
                                     columns={3} 
                                     required
                                 />
                             </FormSection>

                             {item.signageType === 'Doormats' && (
                                 <FormSection title="Doormat Size" step={3} required>
                                     <CheckboxGroup 
                                         name={`doormatSize_${index}`} 
                                         options={['2x3', '3x4', '4x6']} 
                                         selectedValue={item.doormatSize} 
                                         onChange={v => updateItemField(index, 'doormatSize', v)} 
                                         columns={3} 
                                         required
                                     />
                                 </FormSection>
                             )}

                             {item.signageType === 'Yard signs' && (
                                 <FormSection title="Yard Sign Size" step={3} required>
                                     <CheckboxGroup 
                                         name={`yardSignSize_${index}`} 
                                         options={['12x18in', '18x24in', '36x24in']} 
                                         selectedValue={item.yardSignSize} 
                                         onChange={v => updateItemField(index, 'yardSignSize', v)} 
                                         columns={3} 
                                         required
                                     />
                                 </FormSection>
                             )}

                             {item.signageType === 'Banners' && (
                                 <FormSection title="Banner Size" step={3} required>
                                     <CheckboxGroup 
                                         name={`bannerSize_${index}`} 
                                         options={['36in', '48in', '60in']} 
                                         selectedValue={item.bannerSize} 
                                         onChange={v => updateItemField(index, 'bannerSize', v)} 
                                         columns={3} 
                                         required
                                     />
                                     <p className="text-sm text-gray-500 mt-2">* Note: All banners are 27in height.</p>
                                 </FormSection>
                             )}

                             {item.signageType && (
                                 <FormSection title={`Quantity for ${item.signageType}`} step={4} required>
                                     <div className="max-w-xs">
                                         <FormInput 
                                            label="Quantity" 
                                            name={`signageQuantity_${index}`} 
                                            type="number" 
                                            min="1"
                                            value={item.signageQuantity} 
                                            onChange={e => updateItemField(index, 'signageQuantity', e.target.value)} 
                                            required 
                                         />
                                     </div>
                                 </FormSection>
                             )}
                         </div>
                    </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-center">
             <button
                type="button"
                onClick={handleAddItem}
                className="px-8 py-3 text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 font-semibold rounded-xl transition-colors"
              >
                + Make Another Request
             </button>
          </div>

          {data.items.some(item => item.mainChoice) && (
            <div className="bg-gray-200 p-6 rounded-2xl shadow-inner border border-gray-300 mt-8">
              <h3 className="text-xl font-bold text-black mb-4">Order Summary</h3>
              <ul className="space-y-3">
                {data.items.map((item, index) => {
                  if (!item.mainChoice) return null;
                  
                  let summaryText = '';
                  
                  if (item.mainChoice === 'Onboarding (New-Hire)') {
                      summaryText = `Onboarding (New-Hire) Request: 4 Polo Shirts (${item.onboardingShirtSize || 'Size pending'}), 1 Hat (One Size Fits All)`;
                      if (item.onboardingStaffName || item.onboardingStaffTitle) {
                          summaryText += ` for ${item.onboardingStaffName || 'Unnamed'}${item.onboardingStaffTitle ? ` (${item.onboardingStaffTitle})` : ''}`;
                      }
                      if (item.onboardingBadgePic.length > 0) summaryText += `, 1 ID-Badge w/ Clip`;
                  } else if (item.mainChoice === 'Existing Employee') {
                      if (item.generalCategory === 'Polo Shirts') {
                          const sizes = Object.entries(item.poloQuantities)
                            .filter(([_, qty]) => Number(qty) > 0)
                            .map(([size, qty]) => `${qty}x ${size}`)
                            .join(', ');
                          summaryText = `Existing Employee Request: Polo Shirts ${sizes ? `(${sizes})` : '(Quantities pending)'}`;
                      } else if (item.generalCategory === 'Fleece Jackets') {
                          const sizes = Object.entries(item.hoodieQuantities)
                            .filter(([_, qty]) => Number(qty) > 0)
                            .map(([size, qty]) => `${qty}x ${size}`)
                            .join(', ');
                          summaryText = `Existing Employee Request: Fleece Jackets ${sizes ? `(${sizes})` : '(Quantities pending)'}`;
                      } else if (item.generalCategory === 'Winter Jackets') {
                          const sizes = Object.entries(item.winterJacketQuantities)
                            .filter(([_, qty]) => Number(qty) > 0)
                            .map(([size, qty]) => `${qty}x ${size}`)
                            .join(', ');
                          summaryText = `Existing Employee Request: Winter Jackets ${sizes ? `(${sizes})` : '(Quantities pending)'}`;
                      } else if (item.generalCategory === 'Hats') {
                          summaryText = `Existing Employee Request: Hats (Quantity: ${item.hatQuantity || 'pending'})`;
                      } else if (item.generalCategory === 'Beanies') {
                          summaryText = `Existing Employee Request: Beanies (${item.winterBeanieStyle ? item.winterBeanieStyle + ', ' : ''}Quantity: ${item.winterBeanieQuantity || 'pending'})`;
                      } else if (item.generalCategory === 'Replacement ID-Badge') {
                          summaryText = `Existing Employee Request: Replacement ID-Badge`;
                          if (item.replacementStaffName || item.replacementStaffTitle) {
                              summaryText += ` for ${item.replacementStaffName || 'Unnamed'}${item.replacementStaffTitle ? ` (${item.replacementStaffTitle})` : ''}`;
                          }
                          if (item.replacementBadgePic.length > 0) summaryText += ` (Picture attached)`;
                      } else {
                          summaryText = `Existing Employee Request (Category pending)`;
                      }
                  } else if (item.mainChoice === 'Signage (Coming Soon)') {
                      summaryText = `Signage Request: ${item.signageType || 'Type pending'}`;
                      if (item.signageType === 'Doormats' && item.doormatSize) summaryText += ` (${item.doormatSize})`;
                      if (item.signageType === 'Yard signs' && item.yardSignSize) summaryText += ` (${item.yardSignSize})`;
                      if (item.signageType === 'Banners' && item.bannerSize) summaryText += ` (${item.bannerSize})`;
                      if (item.signageQuantity) summaryText += ` (Quantity: ${item.signageQuantity})`;
                  }

                  const itemPrice = calculateItemPrice(item);
                  return (
                    <li key={item.id} className="flex items-start justify-between bg-white p-3 rounded-lg shadow-sm">
                      <div className="flex items-start">
                        <span className="flex-shrink-0 h-6 w-6 rounded-full bg-gray-300 text-black flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                          {index + 1}
                        </span>
                        <span className="text-black font-medium mt-0.5">{summaryText}</span>
                      </div>
                      {itemPrice > 0 && (
                        <span className="font-semibold text-gray-700 whitespace-nowrap ml-4 mt-0.5">
                          ${itemPrice.toFixed(2)}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
              
              {(() => {
                const total = data.items.reduce((sum, item) => sum + calculateItemPrice(item), 0);
                if (total > 0) {
                  return (
                    <div className="mt-4 border-t border-gray-300 pt-4 text-right">
                      <div className="text-xl font-bold text-black">Total: ${total.toFixed(2)}</div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}

          <div className="flex flex-col items-center sm:items-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full sm:w-auto px-10 py-4 text-lg font-bold rounded-xl shadow-lg transition-all ${
                isSubmitting
                  ? 'bg-gray-400 text-white cursor-not-allowed opacity-70'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-500/30'
              }`}
            >
              {isSubmitting ? (
                 <span className="flex items-center justify-center">
                   <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                   Submitting Request...
                 </span>
              ) : 'Submit Request'}
            </button>
          </div>

          {submitStatus === 'error' && (
            <div className="text-red-500 text-center font-semibold text-lg p-4 bg-red-50 rounded-lg border border-red-200">
              There was an error submitting your request. Please try again.
            </div>
          )}
        </form>

        <div className="mt-12 text-center text-sm text-gray-600">
          Need Help? Please email <a href="mailto:admin@faroush.com" className="text-indigo-600 hover:underline">admin@faroush.com</a> for assistance.
        </div>
      </div>

      {showBeanieModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in"
          onClick={() => setShowBeanieModal(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-4">
              <h3 className="text-xl font-bold text-gray-900">Beanie Styles</h3>
              <button 
                type="button"
                onClick={() => setShowBeanieModal(false)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1 transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 mb-4">
              <img 
                src="/beanie-styles.jpg" 
                alt="Beanie Styles - Cuffed vs Cap" 
                className="w-full h-auto max-h-[60vh] object-contain mx-auto"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-center text-sm font-medium text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div>
                <span className="font-bold text-indigo-700 block text-base">Cuffed</span>
                <span className="text-gray-500 text-xs">Features a classic fold-up knit cuff</span>
              </div>
              <div>
                <span className="font-bold text-indigo-700 block text-base">Cap</span>
                <span className="text-gray-500 text-xs">Uncuffed skull cap with clean edge</span>
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center">
              <a 
                href="/beanie-styles.jpg" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-indigo-600 hover:underline inline-flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open image in new tab
              </a>
              <button
                type="button"
                onClick={() => setShowBeanieModal(false)}
                className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="fixed bottom-4 right-4 text-xs text-gray-400 opacity-70">
        Powered by Faroush Development Group LLC
      </div>
    </div>
  );
};

export default App;
