	// Focus first input when modal opens
	useEffect(() => {
		if (!modal.type) return;
		
		const timer = setTimeout(() => {
			if (modal.type === 'income' && incomeSourceRef.current) {
				incomeSourceRef.current.focus();
			} else if (modal.type === 'expense' && expenseDescriptionRef.current) {
				expenseDescriptionRef.current.focus();
			} else if (modal.type === 'loan' && loanNameRef.current) {
				loanNameRef.current.focus();
			} else if (modal.type === 'debt' && debtNameRef.current) {
				debtNameRef.current.focus();
			}
		}, 100);
		
		return () => clearTimeout(timer);
	}, [modal.type]);
